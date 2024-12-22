import re

'''        if hall_number == '7':
            return 'Nanyang Crescent Halls'
        if hall_number == '1' or hall_number == '2':
            return 'Hall 1/2'
        if hall_number == '10' or hall_number == '11':
            return 'Hall 10/11'
        if hall_number == '8' or hall_number == '9':
            return 'Hall 8/9'
            '''
# characteristics
halls = ["Hall " + str(x) for x in range(1, 17)] + ["Tamarind", "Saraca", "Binjai", "Banyan", "Tanjong", "Crescent", "Pioneer", "Grad Hall"]
schools = ['NIE', 'MAE', 'SCSE', 'MSE', 'CEE', 'ASE', 'SCBE', 'SBS', 'EEE', 'NBS', 'WKWSCI', 'SPMS', 'SOH', 'Graduate College', 'LKCMedicine', 'ADM']
study = ['Lee Wee Nam Lib', 'Arc', 'Hive', 'TRs']
NS_LTs = ['TCT', 'LKC', 'LT1A', 'LT2A', 'LT19A', 'LT1'] + ["LT" + str(x) for x in range(3, 21)] # apparently TCT is LT2
SS_LTs = ['LHS-LT', 'LF-LT', 'LKC-LT', 'Nanyang Audi'] + ["LT" + str(x) for x in range(22, 30)]
LTs = NS_LTs + SS_LTs
other_facilities = ['Yunnan Garden', 'Wave', 'SAC', 'Fullerton', 'SSC']

# must filter school before TR/LT bcos some LTs AND TRS are under school
# MUST ALSO FILTER BY LHN/LHS ARC/HIVE FIRST BCOS OVERLAPPING TR NUMBER
NS_TRs = ["TR" + str(x) for x in range(1, 38)] + ['TR43', 'TR44']
SS_TRs = ["TR" + str(x) for x in range(61, 167)] + ['TR43', 'TR44']
eateries = ['Koufu', 'Quad', 'Fine Foods']

# nanyang house
# to plot location clusters
hall_clusters = {"Hall 1/2/4/Wave": ['Hall 1', 'Hall 2', 'Hall 4,' 'Wave', 'Yunnan Corner'],
                 "Hall 8/9/ADM" : ['Hall 8', 'Hall 9', 'ADM', 'Hall 10', 'Saraca Hall'],
                 "Hall 3/16/12/13/14/15": ["Hall 3", "Hall 16", "Hall 12", "Hall 13",  "Hall 14", "Hall 15"],
                 "North Hill/Grad Hall" : ["Hall 10", "Hall 11", "Binjai", "Banyan", "Tanjong", "Grad Hall 1", "Grad Hall 2"],
                 "Nanyang Crescent" : ["Tamarind", "Saraca", "Hall 7", "Hall 3", "Hall 16", 'Hall 11'],
                 "CresPion" : ['Hall 6', 'Pioneer', 'Crescent', 'Hall 2', 'Hall 1', 'Wave']
                 }
school_clusters = {"North Spine": ['Arc', 'Koufu', 'MAE', 'SCSE', 'MSE', 'CEE', 'ASE', 'Lee Wee Nam Lib', 'SCBE', 'SBS', 'Graduate College', 'SAC', 'SSC'], 
                   "South Spine": ['Fine Foods', 'Quad', 'EEE', 'NBS', 'WKWSCI', 'SPMS', 'Hive', 'SOH', 'LKCMedicine', 'Yunan'],
                   "NIE": ['NIE']
                   }

def determine_location_category(location):
    ans = []


def has_tr_number(msg):
    tr_number = re.search(r"(?:tutorial\s?(?:room|rm)|tr)[-\s\+@]*(\d+)", msg) # capture number from tr
    if tr_number:
        return tr_number.group(1)

def has_lt_number(msg):
    lt_number = re.search(r"(?:lt|lecture|lect?\s?(?:theatre|theater|hall))[-\s0\+]*(\d+[Aa]?)", msg) # capture number from lt
    if lt_number:
        return lt_number.group(1).upper()

def is_lt(msg):
    if re.search(r'lkc|lee\s?kong\s?chien', msg) and not re.search(r'emb|medicine|(?:lkc|lee\skong\schien)\s?med', msg):
        return 'LKC-LT'
    if re.search(r'tct|tan\s?chin\s?tuan', msg):
        return 'TCT-LT'
    if re.search(r'lhn|arc', msg) and re.search(r"(?:lt|lect?\s?(?:theatre|theater|hall))", msg):
        return 'Arc'
    if re.search(r'(lf|lee foundation)[-\s]?(lt|lect?\s?(?:theatre|theater|hall))', msg):
        return 'WKW'
    if has_lt_number(msg):
        lt_number = has_lt_number(msg)
        if lt_number =='2': # LT2 is TCTLT
            return 'TCT-LT'
        return 'LT' + lt_number

def is_ns_lt(msg):
    lt_name = is_lt(msg)
    if lt_name in ['TCT-LT', 'Arc']:
        return lt_name
    if lt_name in ['LT' + str(x) for x in range (1, 21)] or lt_name == 'LT1A' or lt_name == 'LT2A' or lt_name == 'LT19A':
        return lt_name

def is_ss_lt(msg):
    lt_name = is_lt(msg)
    if lt_name in ['LKC-LT', 'WKW']:
        return lt_name
    if lt_name in ['LT' + str(x) for x in range (22, 30)]:
        return lt_name

def is_tr(msg):
    if re.search(r"\barc\b|lhn|learning\s?hub\s?north", msg): # arc as its own word to prevent substring
        return 'Arc'
    if re.search(r"hive|lhs|learning\s?hub\s?south", msg): # mentions of hive or ss
        return 'Hive'
    if has_tr_number(msg):
        if re.search(r"gaia", msg):
            return 'Gaia'
        tr_number = int(has_tr_number(msg))
        if 151 <= tr_number <= 166:
            return 'NBS TRs'
        if 61 <= tr_number <= 121 or re.search(r'ss|south\sspine', msg):
            return 'SS TRs'
        if re.search(r'\bns\b|north\s?spine', msg): # assume this means ns tr
            return 'NS TRs'
        return 'Arc' # assume default tr is arc tr because hive and arc tr numbers overlap


def is_arc(msg):
    return (is_tr(msg) == 'Arc')

def is_hive(msg):
    return (is_tr(msg) == 'Hive')


def is_hall(msg): # maybe put last because nh and crescent
    if re.search('tama', msg) or re.search('saraca', msg)or re.search(r'(nanyang|ny)\s?(cres)', msg):
        return 'Nanyang Crescent Halls'
    if re.search('binjai', msg) or re.search('banyan', msg) or re.search('nh', msg) or re.search(r'north\s?hill', msg):
        return 'North Hill Halls'
    if re.search('crescent', msg) or re.search('pioneer', msg) or re.search('crespion', msg):
        return 'CresPion Halls'
    if re.search('hall', msg) and re.search('grad', msg):
        return 'Grad Halls' 
    if re.search('yunnan corner', msg):
        return 'Hall 1' 
    # hall_number = re.search(r'(?:hall|h|canteen|can|food\s?court)[-\s]?(\d+)', msg) # hall with number
    hall_number = re.search(r'(?:(?:(?:hall|canteen|can|food\s?court)[-\s]?)|\bh\s?)(\d+)', msg) # hall with number
    if hall_number:
        hall_number = hall_number.group(1)
        if hall_number == '7':
            return 'Nanyang Crescent Halls'
        return 'Hall ' + hall_number
    return 0


def is_acad_block(msg):
    if re.search(r'n1', msg):
        return 'N1'
    if re.search(r'n2', msg):
        return 'N2'
    if re.search(r'n3', msg):
        return 'N3'
    if re.search(r'n4', msg):
        return 'N4'
    if re.search(r's1', msg):
        return 'S1'
    if re.search(r's2', msg):
        return 'S2'
    if re.search(r's3', msg):
        return 'S3'
    if re.search(r's4', msg):
        return 'S4'
    return 0

def is_school(msg):
    if re.search(r'nbs', msg):
        return 'NBS'
    if re.search(r'wkw|wee\s?kim\s?wee', msg) or is_lt(msg)=='WKW':
        return 'WKW'
    if re.search(r'scse|hwlab|ccds', msg):
        return 'CCDS'
    if re.search(r'cceb', msg):
        return 'CCEB'
    if re.search(r'eee', msg):
        return 'EEE'
    if re.search(r'nie', msg):
        return 'NIE'
    if re.search(r'sbs|bio|tcm', msg):
        return 'SBS'
    if re.search(r'cae|mae|aero', msg):
        return 'MAE'
    if re.search(r'gaia|[^a-zA-Z\d]abs[^a-zA-Z\d]', msg):
        return 'Gaia'
    if re.search(r'hss|hass|soh|humanities|cohass|shhk|sss', msg):
        return 'COHASS'
    if re.search(r'\bemb\b|medicine|(?:lkc|lee\skong\schien)\s?med', msg):
        return 'LKCMed'
    if re.search(r'spms|\bmas\b', msg):
        return 'SPMS'
    if re.search(r'\badm\b', msg):
        return 'ADM'
    if re.search(r'abn|graduate college', msg):
        return 'Graduate College'
    if re.search(r'\base\b', msg):
        return 'ASE'
    return 0

def is_ns(msg): # last ish
    if is_tr(msg) == 'NS TRs' or is_tr(msg) == 'Arc':
        return is_tr(msg)
    if is_school(msg):
        sch = is_school(msg)
        if sch in ['CCDS', 'SBS', 'MAE', 'LKCMed', 'Graduate College', 'ASE']:
            return True
    if is_ns_lt(msg):
        return is_ns_lt(msg)
    if re.search(r'lwn|lee\s?wee\s?nam', msg):
        return 'LWN'
    if re.search(r'\baia|global lounge', msg):
        return 'AIA Canopy'
    if re.search(r'mac|mcd', msg):
        return 'McD'
    if re.search(r'prime', msg):
        return 'Prime'
    if re.search(r'koufu', msg):
        return 'Koufu'
    if re.search(r'quad', msg):
        return 'Quad'
    if re.search(r'sac|student\s?activities\s?(?:center|centre)', msg):
        return 'SAC'
    if re.search(r'green\s?space', msg):
        return 'North Spine'
    if re.search(r'starbuck', msg):
        return 'Starbucks'
    if re.search(r'n1', msg):
        return 'N1'
    if re.search(r'n2', msg):
        return 'N2'
    if re.search(r'n3', msg):
        return 'N3'
    if re.search(r'n4', msg):
        return 'N4'
    if re.search(r'\sns|north\s?spine', msg):
        if re.search(r'(?:canteen|can|food\s?court)b', msg):
            return 'Koufu'
        return 'North Spine (Other)'
    return is_ns_lt(msg)


def is_ss(msg):
    if is_tr(msg) == 'SS TRs' or is_tr(msg) == 'Hive':
        return is_tr(msg)
    if is_school(msg):
        sch = is_school(msg)
        if sch in ['NBS', 'WKW', 'EEE', 'Gaia', 'COHASS', 'SPMS']:
            return sch
    if is_ss_lt(msg):
        return is_ss_lt(msg)
    if re.search(r'\bnya\b|(?:ny|nanyang?|ntu)\s?audi', msg):
        return 'NYA'
    if re.search(r'chinese heritage (centre|center)', msg):
        return 'Chinese Heritage Centre'
    if re.search(r'fine\s?food', msg):
        return 'Fine Food'
    if re.search(r'rtp|technopreneur|ntc|research techno plaza', msg):
        return 'Research Techno Plaza'
    if re.search(r's1', msg):
        return 'S1'
    if re.search(r's2', msg):
        return 'S2'
    if re.search(r's3', msg):
        return 'S3'
    if re.search(r's4', msg):
        return 'S4'
    if re.search(r'cheers', msg):
        return 'Cheers'
    if re.search(r'\bss\b|south\s?spine', msg):
        if re.search(r'(?:canteen|can|food\s?court)b', msg):
            return 'Fine Food'
        return 'South Spine (Other)'

def is_other(msg):
    if re.search(r'yunnan garden', msg):
        return 'Yunnan Garden'
    if re.search(r'wave|src|sports|grandstand|hall w', msg):
        return 'SRC'
    if re.search(r'fullerton', msg):
        return 'Fullerton'
    if re.search(r'ssc|student\s?services\s?cent', msg):
        return 'SSC'
    if re.search(r'nyh|(ny|nanyang)\s?(hill|house)', msg):
        return 'Nanyang House'
    if re.search(r'ntupreneur|inno', msg):
        return 'NTUpreneur Office'
    if re.search(r'\bnec\b|nanyang executive|campus clubhouse', msg):
        return 'Nanyang Executive Centre'

def determine_main_category_ntu(msg):
    if is_ns(msg):
        return 'North Spine'
    elif is_ss(msg):
        return 'South Spine'
    if is_hall(msg):
        return 'Halls'
    return 'Other'
def determine_sub_category_ntu(msg):
    if is_school(msg):
        return 'Schools'
    if is_tr(msg):
        return 'TRs'
    if is_lt(msg):
        return 'LTs'
    if determine_location_ntu == 'Unknown':
        return 'Unknown'
    return 'Other'
def determine_categories_ntu(msg):
    categories = []
    if is_school(msg):
        categories.append('School') 
    if is_hall(msg):
        categories.append('Hall') 
    if is_other(msg):
        categories.append('Other') 
    if is_ns(msg):
        categories.append('North Spine') 
    elif is_ss(msg):
        categories.append('South Spine') 
    if is_tr(msg):
        categories.append('TRs') 
    if is_lt(msg):
        categories.append('LTs') 
    if not categories: # no main category
        if determine_location_ntu == 'Unknown':
            categories.append('Unknown') 
        else:
            categories.append('Other') 
    return ';'.join(categories)

    
        
def determine_location_ntu(msg):
    if is_school(msg):
        return is_school(msg)
    elif is_hall(msg):
        return is_hall(msg)
    elif is_other(msg):
        return is_other(msg)
    elif is_ns(msg):
        return is_ns(msg)
    elif is_ss(msg):
        return is_ss(msg)
    elif is_acad_block(msg):
        return is_acad_block(msg)
    else: # cannot be found
        return "Unknown"

def has_cleared_msg(msg):
    if (re.search(r'(?!(?:will|to)\s)(clear|finish)[a-zA-Z]+\s(?!by\s|at\s)', msg)) and not re.search(r'soon', msg):
        return True

