results=[]
operands_list=[]
rules_parse = True
with open('input.txt', 'r') as file:
    # Read each line one by one
    for line in file:
        # Process each line here (for example, print it)
        line = line.strip().split(':')
        results.append(int(line[0]))
        operands_list.append(list(map(int, line[1].split())))

l = len(results)

def canmakeresult(result, currresult, operands):
    op1 = currresult
    op2 = operands[0]
    if currresult > result:
        return False
    if len(operands)==1:
        if op1+op2==result or op1*op2==result or int(str(op1) + str(op2))==result:
            return True
        return False
    return canmakeresult(result, op1+op2, operands[1:]) or canmakeresult(result,op1*op2, operands[1:]) or canmakeresult(result,int(str(op1) + str(op2)), operands[1:])

ans=0
for i in range(len(results)):
    result = results[i]
    operands = operands_list[i]
    if canmakeresult(result, operands[0], operands[1:]):
        print(operands)
        ans+= result
print(ans)