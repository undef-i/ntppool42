#!/bin/bash
for i in `dirname $_`/../data/*; do
  tmpf=`mktemp`
  cat $i | tr -d '[:blank:]' | uniq | sort -Vo $tmpf
  if grep -qE '^.+6\.txt' <<< "$i"; then
    grep -E '^[0-9a-f:]+,.+-MNT$' $tmpf > $i
  elif grep -qE '^.+4\.txt' <<< "$i"; then
    grep -E '^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3},.+-MNT$' $tmpf > $i
  elif grep -qE '^ns.txt$' <<< `basename "$i"`; then
    grep -E '^.+,.+-MNT' $tmpf > $i
  else
    printf 'warn: unknown file: %s\n' "$i"
  fi
  rm $tmpf
done
