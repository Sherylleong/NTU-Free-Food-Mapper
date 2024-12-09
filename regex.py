import re

with open('input.txt') as f:
    lines = list(map(lambda line: re.findall(r'[A-Za-z0-9.]+', line)[0], f.readlines()))

antinode_grid = list(lines)

x_bound = len(lines[0])-1
y_bound = len(lines)-1

satellites = {}

def try_add_antinode(x, y):
    if 0 <= x <= x_bound and 0 <= y <= y_bound and antinode_grid[y][x] != '#':
        antinode_grid[y] = antinode_grid[y][:x] + '#' + antinode_grid[y][x+1:]

for y_idx, line in enumerate(lines):
    for x_idx, char in enumerate(line):
        if re.match(r'[A-Za-z0-9]', char):
            pos = [x_idx, y_idx]
            if char in satellites:
                satellites[char].append(pos)
            else:
                satellites[char] = [pos]

for satellite in satellites:
    pos_list = satellites[satellite]
    for pos_idx, pos in enumerate(pos_list):
        for compare_pos in pos_list[:pos_idx] + pos_list[pos_idx+1:]:
            x_diff = pos[0] - compare_pos[0]
            y_diff = pos[1] - compare_pos[1]
            pot_x1 = pos[0] + x_diff
            pot_y1 = pos[1] + y_diff
            try_add_antinode(pot_x1, pot_y1)
            pot_x2 = compare_pos[0] - x_diff
            pot_y2 = compare_pos[1] - y_diff
            try_add_antinode(pot_x2, pot_y2)

count = 0
for line in antinode_grid:
    count += line.count('#')

print("Result:", count)