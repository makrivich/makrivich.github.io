#19
def f(a,b,p):
    if a+b>=59 and p==1: return True
    if (a+b>=59 and p!=1) or (a+b<59 and p==1): return False
    if p%2==0:
        return f(a+1, b, p+1) or f(a*2, b, p+1) or f(a, b+1, p+1) or f(a, b*2, p+1)
    else: return f(a+1, b, p+1) and f(a*2, b, p+1) and f(a, b+1, p+1) and f(a, b*2, p+1)
for b in range(1,54):
    if f(5,b,0)==True:
        print(b)
        break
print("-----------------------------------")
#20
def f(a,b,p):
    if a+b>=59 and p==3: return True
    if (a+b>=59 and p!=3) or (a+b<59 and p==3): return False
    if p%2!=0:
        return f(a+1, b, p+1) and f(a*2, b, p+1) and f(a, b+1, p+1) and f(a, b*2, p+1)
    else: return f(a+1, b, p+1) or f(a*2, b, p+1) or f(a, b+1, p+1) or f(a, b*2, p+1)
for b in range(1,54):
    if f(5,b,0)==True:
        print(b)
print("-----------------------------------")
#21
def f(a,b,p):
    if a+b>=59 and (p==2 or p==4): return True
    if (a+b>=59 and (p!=2 or p!=4)) or (a+b<59 and p==4): return False
    if p%2==0:
        return f(a+1, b, p+1) and f(a*2, b, p+1) and f(a, b+1, p+1) and f(a, b*2, p+1)
    else: return f(a+1, b, p+1) or f(a*2, b, p+1) or f(a, b+1, p+1) or f(a, b*2, p+1)
for b in range(1,54):
    if f(5,b,0)==True:
        print(b)
        break
