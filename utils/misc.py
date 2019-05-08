###################################################

SEP = "----------"

###################################################

def firstbetween(content, left, right):
    if left == "":
        parts = [None, content]
    else:
        parts = content.split(left)
    if(len(parts) > 1):
        parts = parts[1].split(right)
        return parts[0]
    else:
        return None

###################################################

def sepprint(content, sep = SEP):
    print(SEP)
    print(content)
    print(SEP)

###################################################
