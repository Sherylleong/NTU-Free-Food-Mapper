import re
from collections import deque 
with open('input.txt') as f:
    for line in f.readlines():
        for n in line:
            deque.append(n)

