#!/bin/bash
for i in `dirname $_`/../data/*; do
  tmpf=`mktemp`
  cat $i | tr -d '[:blank:]' | uniq | sort -Vo $tmpf
  if grep -qE '^.+6\.txt' <<< "$i"; then
    grep -E '^[0-9a-f:]+$' $tmpf > $i
  elif grep -qE '^.+4\.txt' <<< "$i"; then
    grep -E '^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$' $tmpf > $i
  else
    cat $tmpf > $i
  fi
  rm $tmpf
done
