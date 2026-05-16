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
    mname: 'ntppool42.vm.mazarino.sess.dn42',
    rname: 'noc.sess.dn42',
    serial: 0,
    refresh: 120,
    retry: 1200,
    expire: 6000,
    minimum: 3600
  }
};

const readDataFile = async (fname) => {
  const s = await fs.readFile(fname, 'utf8');
  return s.split(/\s+/).filter(Boolean).map(e => e.split(',')[0]);
};
const [ns, anycast4, anycast6, asia4, asia6, amer4, amer6, euro4, euro6, ocea4, ocea6, anta4, anta6] = await Promise.all([
  readDataFile('data/ns.txt'),
  readDataFile('data/anycast4.txt'),
  readDataFile('data/anycast6.txt'),
  readDataFile('data/asia4.txt'),
  readDataFile('data/asia6.txt'),
  readDataFile('data/amer4.txt'),
  readDataFile('data/amer6.txt'),
  readDataFile('data/euro4.txt'),
  readDataFile('data/euro6.txt'),
  readDataFile('data/ocea4.txt'),
  readDataFile('data/ocea6.txt'),
  readDataFile('data/anta4.txt'),
  readDataFile('data/anta6.txt'),
]);

function shufArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (1 + i));
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
    console.log(rinfo, question);
    const ans = [], ats = [];
    let flags = (ZONE_SOA.name === qName || qName.endsWith('.' + ZONE_SOA.name)) && dnsPacket.AUTHORITATIVE_ANSWER;
    let rcode = (flags & dnsPacket.AUTHORITATIVE_ANSWER) ? rcodes.toRcode('NOERROR') : rcodes.toRcode('REFUSED');
    if (qClass !== 'IN') rcode = rcodes.toRcode('REFUSED');
    q: if (rcode === rcodes.toRcode('REFUSED')) {
      break q;
    } else if (qName === ZONE_SOA.name) {
      if (qType === 'SOA')
        ans.push(ZONE_SOA)
      else if (qType === 'NS')
        ans.push(...ns.map(data => { return {name:qName,type:'NS',ttl:3600,data}}))
      else if (qType === 'A')
        ans.push(...shufArray(anycast4.concat(asia4).concat(ocea4).concat(amer4).concat(anta4).concat(euro4)).slice(0, 4).map(data=>{ return {name:qName,type:'A',class:'IN',ttl:120,data}; }))
      else if (qType === 'AAAA')
        ans.push(...shufArray(anycast6.concat(asia6).concat(ocea6).concat(amer6).concat(anta6).concat(euro6)).slice(0, 4).map(data=>{ return {name:qName,type:'AAAA',class:'IN',ttl:120,data}; }))
      else 
        ats.push(ZONE_SOA);
    } else if (qType === 'ANY') {
      ans.push({name:qName,type:'HINFO',class:'IN',ttl:3600,data:{cpu:'RFC8482',os:''}});
    } else if (qName === 'anycast.' + ZONE_SOA.name) {
      if (qType === 'A') ans.push(...shufArray([...anycast4]).slice(0, 4).map(data=>{ return {name:qName,type:'A',class:'IN',ttl:120,data}; }));
      else if (qType === 'AAAA') ans.push(...shufArray([...anycast6]).slice(0, 4).map(data=>{ return {name:qName,type:'AAAA',class:'IN',ttl:120,data}; }));
      else ats.push(ZONE_SOA);
    } else if (qName === 'asia.' + ZONE_SOA.name) {
      if (qType === 'A') ans.push(...shufArray(asia4.concat(anycast4)).slice(0, 4).map(data=>{ return {name:qName,type:'A',class:'IN',ttl:120,data}; }));
      else if (qType === 'AAAA') ans.push(...shufArray(asia6.concat(anycast6)).slice(0, 4).map(data=>{ return {name:qName,type:'AAAA',class:'IN',ttl:120,data}; }));
      else ats.push(ZONE_SOA);
    } else if (qName === 'amer.' + ZONE_SOA.name) {
      if (qType === 'A') ans.push(...shufArray(amer4.concat(anycast4)).slice(0, 4).map(data=>{ return {name:qName,type:'A',class:'IN',ttl:120,data}; }));
      else if (qType === 'AAAA') ans.push(...shufArray(amer6.concat(anycast6)).slice(0, 4).map(data=>{ return {name:qName,type:'AAAA',class:'IN',ttl:120,data}; }));
      else ats.push(ZONE_SOA);
    } else if (qName === 'ocea.' + ZONE_SOA.name) {
      if (qType === 'A') ans.push(...shufArray(ocea4.concat(anycast4)).slice(0, 4).map(data=>{ return {name:qName,type:'A',class:'IN',ttl:120,data}; }));
      else if (qType === 'AAAA') ans.push(...shufArray(ocea6.concat(anycast6)).slice(0, 4).map(data=>{ return {name:qName,type:'AAAA',class:'IN',ttl:120,data}; }));
      else ats.push(ZONE_SOA);
    } else if (qName === 'euro.' + ZONE_SOA.name) {
      if (qType === 'A') ans.push(...shufArray(euro4.concat(anycast4)).slice(0, 4).map(data=>{ return {name:qName,type:'A',class:'IN',ttl:120,data}; }));
      else if (qType === 'AAAA') ans.push(...shufArray(euro6.concat(anycast6)).slice(0, 4).map(data=>{ return {name:qName,type:'AAAA',class:'IN',ttl:120,data}; }));
      else ats.push(ZONE_SOA);
    } else if (qName === 'anta.' + ZONE_SOA.name) {
      if (qType === 'A') ans.push(...shufArray(anta4.concat(anycast4)).slice(0, 4).map(data=>{ return {name:qName,type:'A',class:'IN',ttl:120,data}; }));
      else if (qType === 'AAAA') ans.push(...shufArray(anta6.concat(anycast6)).slice(0, 4).map(data=>{ return {name:qName,type:'AAAA',class:'IN',ttl:120,data}; }));
      else ats.push(ZONE_SOA);
    } else {
      rcode = rcodes.toRcode('NXDOMAIN');
      ats.push(ZONE_SOA);
    }
    return dnsPacket.encode({
      type: 'response',
      id: request.id,
      flags: flags | rcode,
      questions: request.questions,
      answers: ans,
      authorities: ats
    });

  } catch (err) {
    console.error(err);
  }
};

const PORT = process.argv[3] || 5333;
const HOST = process.argv[2] || '::';

const udpServer = dgram.createSocket(net.isIPv6(HOST) ? 'udp6' : 'udp4');
udpServer.on('message', (msg, rinfo) => {
  try {
    const responseBuf = handleDnsQuery(msg, {address:rinfo.address,port:rinfo.port}) || Buffer.alloc(0);
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
      if (expectedLength < 12) {
        socket.destroy();
        return;
      }
      if (buffer.length < 2 + expectedLength) {
        break;
      }
      const dnsQueryBuf = buffer.subarray(2, 2 + expectedLength);
      buffer = buffer.subarray(2 + expectedLength);
      try {
        const dnsResponseBuf = handleDnsQuery(dnsQueryBuf, { address: socket.remoteAddress, port: socket.remotePort }) || Buffer.alloc(0);
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
