import dgram from 'node:dgram';
import net from 'node:net';
import fs from 'node:fs/promises';

import dnsPacket from 'dns-packet';
import rcodes from 'dns-packet/rcodes.js';

const ZONE_SOA = {
  name: 'pool.ntp.dn42',
  type: 'SOA',
  ttl: 86400,
  data: {
    mname: 'ns1.sess.dn42',
    rname: 'noc.sess.dn42',
    serial: 0,
    refresh: 120,
    retry: 1200,
    expire: 6000,
    minimum: 3600
  }
};

const anycast4 = (await fs.readFile('data/anycast4.txt', 'utf8')).split('\n').filter(Boolean);
const anycast6 = (await fs.readFile('data/anycast6.txt', 'utf8')).split('\n').filter(Boolean);
const asia4 = (await fs.readFile('data/asia4.txt', 'utf8')).split('\n').filter(Boolean);
const asia6 = (await fs.readFile('data/asia6.txt', 'utf8')).split('\n').filter(Boolean);

function shufArray(arr) {
  for (let i = arr.length - 1; i >= 0; i--) {
    const j = Math.floor(Math.random() * i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const handleDnsQuery = (msg, rinfo) => {
  try {
    const request = dnsPacket.decode(msg);
    if (request.type !== 'query' || !request.questions.length) return;

    const question = request.questions[0];
    const qName = question.name.toLowerCase();
    const qType = question.type;
    const qClass = question.class;

    console.log(question);

    const ans = [], ats = [];

    let flags = ZONE_SOA.name === qName || qName.endsWith('.' + ZONE_SOA.name) ? dnsPacket.AUTHORITATIVE_ANSWER : rcodes.toRcode('REFUSED');
    if (qClass !== 'IN') flags |= rcodes.toRcode('REFUSED')

    q: if (flags & rcodes.toRcode('REFUSED')) {
      break q;
    } else if (qName === ZONE_SOA.name) {
      if (qType === 'SOA')
        ans.push(ZONE_SOA)
      else if (qType === 'NS')
        ans.push({
        })
      else 
        ats.push(ZONE_SOA);
    } else if (qType === 'ANY') {
      ans.push({name:qName,type:'HINFO',class:'IN',ttl:3600,data:{cpu:'RFC8482',os:''}});
    } else if (qName === 'anycast.' + ZONE_SOA.name) {
      if (qType === 'A') ans.push(...shufArray(anycast4).slice(0, 4).map(data=>{ return {name:qName,type:'A',class:'IN',ttl:120,data}; }));
      else if (qType === 'AAAA') ans.push(...shufArray(anycast6).slice(0, 4).map(data=>{ return {name:qName,type:'AAAA',class:'IN',ttl:120,data}; }));
      else ats.push(ZONE_SOA);
    } else if (qName === 'asia.' + ZONE_SOA.name) {
      if (qType === 'A') ans.push(...shufArray([...asia4, ...anycast4]).slice(0, 4).map(data=>{ return {name:qName,type:'A',class:'IN',ttl:120,data}; }));
      else if (qType === 'AAAA') ans.push(...shufArray([...asia6, ...anycast6]).slice(0, 4).map(data=>{ return {name:qName,type:'AAAA',class:'IN',ttl:120,data}; }));
      else ats.push(ZONE_SOA);
    } else {
      flags = flags | rcodes.toRcode('NXDOMAIN');
      ats.push(ZONE_SOA);
    }

    return dnsPacket.encode({
      type: 'response',
      id: request.id,
      flags,
      questions: request.questions,
      answers: ans,
      authorities: ats
    });

  } catch (err) {
    console.error(err);
  }
};

const PORT = 5333;
const HOST = '127.0.0.1';

const udpServer = dgram.createSocket('udp4');
udpServer.on('message', (msg, rinfo) => {
  try {
    const responseBuf = handleDnsQuery(msg);
    udpServer.send(responseBuf, 0, responseBuf.length, rinfo.port, rinfo.address);
  } catch (err) {
    console.error('udp server error:', err.message);
  }
});
udpServer.bind(PORT, HOST, () => console.log(`udp server at ${HOST}:${PORT}`));

const tcpServer = net.createServer((socket) => {
  let buffer = Buffer.alloc(0);
  socket.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    while (buffer.length >= 2) {
      const expectedLength = buffer.readUInt16BE(0);
      if (buffer.length < 2 + expectedLength) {
        break;
      }
      const dnsQueryBuf = buffer.subarray(2, 2 + expectedLength);
      buffer = buffer.subarray(2 + expectedLength);
      try {
        const dnsResponseBuf = handleDnsQuery(dnsQueryBuf);
        const lengthPrefix = Buffer.alloc(2);
        lengthPrefix.writeUInt16BE(dnsResponseBuf.length, 0);
        socket.write(Buffer.concat([lengthPrefix, dnsResponseBuf]));
      } catch (err) {
        console.error('tcp server error:', err.message);
        socket.destroy();
      }
    }
  });
  socket.on('error', (err) => {
    console.error(err);
  });
});
tcpServer.listen(PORT, HOST, () => console.log(`tcp server at ${HOST}:${PORT}`))
