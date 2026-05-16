#!/bin/sh
PATH="/sbin:$PATH"
if ! command -v ntpdate; then
  echo "fatal: ntpdate not found" >&2
  exit 127
fi
code=0
for i in data/*[4,6].txt; do
  for j in `shuf $i | head -n20 | cut -d, -f1`; do
    ntpdate -q $j
    [ "$?" = 0 ] && continue
    printf 'warn: %s failed (1/3)\n' "$j" >&2
    ntpdate -q $j
    [ "$?" = 0 ] && continue
    printf 'warn: %s failed (2/3)\n' "$j" >&2
    ntpdate -q $j
    [ "$?" = 0 ] && continue
    printf 'error: %s failed (3/3)\n' "$j" >&2
    code=1
  done
done
exit $code
