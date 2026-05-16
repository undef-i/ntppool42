#!/bin/sh
PATH="/sbin/:$PATH"
if ! command -v dig; then
  echo "fatal: dig not found" >&2
  exit 127
fi
code=0
for j in `shuf $(dirname $_)/../data/ns.txt | head -n 20`; do
  dig @$j pool.ntp.dn42. SOA
  [ "$?" = 0 ] && continue
  printf 'warn: %s failed (1/3)' "$j"
  dig @$j pool.ntp.dn42. SOA
  [ "$?" = 0 ] && continue
  printf 'warn: %s failed (2/3)' "$j"
  dig @$j pool.ntp.dn42. SOA
  [ "$?" = 0 ] && continue
  printf 'error: %s failed (3/3)' "$j" >&2
  code=1
done
exit $code
