rules = {}
map=[]
rules_parse = True
with open('input.txt', 'r') as file:
    # Read each line one by one
    for line in file:
        # Process each line here (for example, print it)
        map.append(line.strip())

h = len(map)
w = len(map[0])
visited = [[0 for i in range(w)]  for j in range(h)]
visited_dirs = [[[] for i in range(w)]  for j in range(h)]
starty, startx =0,0
print(map)
for index, string in enumerate(map):
    if '^' in string:
        starty, startx = index, string.index('^')
        break
import copy

# Create a deep copy of the visited list

def has_incoming_obstacle(currx,curry,dir):
    next_y = curry+dir[1]
    next_x = currx+dir[0]
    if map[next_y][next_x]=='#':
        return True
def will_exit(currx,curry,dir):
    next_y = curry+dir[1]
    next_x = currx+dir[0]
    if next_y >= h or next_y <0 or next_x >= w or next_x <0:
        return True
def will_loop_if_obstacle_ahead(currx,curry,dir):
    if will_exit(currx,curry,dir): # cant put obstacle there
        print('aa')
        return 0
    tempvisited = copy.deepcopy(visited)
    tempvisiteddirs = copy.deepcopy(visited_dirs)
    turndir = (-dir[1], dir[0])
    #print('start', currx,curry, turndir)
    while True:
        #print(currx, curry, turndir)
        if will_exit(currx,curry,turndir):
            return 0
        if tempvisited[curry][currx] and (turndir in tempvisiteddirs[curry][currx]):
            print('yes')
            #print(tempvisiteddirs[curry][currx])
            return 1
        tempvisited[curry][currx]=1
        if turndir not in tempvisiteddirs[curry][currx]:
            tempvisiteddirs[curry][currx].append(turndir)        
        if has_incoming_obstacle(currx,curry,turndir):
            turndir = (-turndir[1], turndir[0])
        currx += turndir[0]
        curry += turndir[1]

ans=0
dir=(0,-1)
currx, curry =startx, starty

while True:
    #print('normal',currx, curry, dir)
    visited[curry][currx]=1
    if dir not in visited_dirs[curry][currx]:
        visited_dirs[curry][currx].append(dir)
    obsx = currx + dir[0]
    obsy = curry + dir[1]
    if will_exit(currx,curry,dir):
        break
    if not has_incoming_obstacle(currx,curry,dir) and not (obsx==startx and obsy==starty) and will_loop_if_obstacle_ahead(currx, curry, dir):
        #print('OBSTRUCT',obsx,obsy)
        ans+=1
    if has_incoming_obstacle(currx,curry,dir):
        dir = (-dir[1], dir[0])
    else:
        currx += dir[0]
        curry += dir[1]
    
print(ans)

