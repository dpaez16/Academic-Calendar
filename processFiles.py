import pandas as pd
import sys, re, os
import datetime

def semesterParse():
	d = datetime.datetime.now()
	if (8 <= d.month) and (d.month <= 12):
		return "Fall {}".format(d.year)
	elif (1 <= d.month) and (d.month <= 5):
		return "Spring {}".format(d.year)
	else:
		return ""

def getSurveyResponses():
	df = pd.read_csv(os.getcwd() + "/class_survey_responses.csv")
	cols = df.columns.tolist()
	responses = []
	for i in range(len(df)):
		responses.append([df[cols[0]][i], df[cols[1]][i], df[cols[2]][i]])
	return responses

def writeResponse(personName, classes):
	df = pd.read_csv(os.getcwd() + "/class_survey_responses.csv")
	cols = df.columns.tolist()

	# remove duplicate entries and append latest entry
	df = df[df[cols[1]] != personName]

	df = df.append( {	cols[0]: datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'), 
						cols[1]: personName, 
						cols[2]: classes
					}, 
					ignore_index=True)
	df.to_csv(os.getcwd() + "/class_survey_responses.csv", index=False)

def processCSV(SURVEY_RESPONSES_CSV):
	# read survey responses from csv file
	df = pd.read_csv(os.getcwd() + '/' + SURVEY_RESPONSES_CSV)
	cols = df.columns.tolist()[1:3]
	df = df[cols]
	df = df.drop_duplicates(subset=cols[0], keep='last') # in case people fill the survey more than once, keeps latest submission
	df = df.reset_index(drop=True)

	# write responses to parse-able txt file
	with open(os.getcwd() + '/classes.txt', 'w+') as f:
		for i in range(len(df)):
			f.write(df[cols[0]][i] + ':' + df[cols[1]][i])
			f.write('\n')

	# open classes.txt
	with open(os.getcwd() + "/classes.txt", "r") as f:
		lines = f.readlines()

	lines = [line.strip() for line in lines]

	class_dict = {}

	for line in lines:
		initials = line.split(':')[0]
		if len(initials) == 3:
			initials = initials.upper()
		
		rest_of_line = ''.join(line.split(':')[1:])
		
		# split by comma
		classes = rest_of_line.upper().split(',')
		for class_code in classes:
			class_code = class_code.strip()
			class_code = ' '.join([part.strip() for part in re.split('(\d+)',class_code)])
			if class_code in class_dict:
				class_dict[class_code].append(initials)
			else:
				class_dict[class_code] = [initials]

	full = []
	matches = []
	singles = []

	for key in class_dict.keys():
		# format line
		out_str = "{}: {}".format(key, str(class_dict[key]))
		
		# put space between subject and course number
		out_str = out_str
		
		full.append(out_str)
		
		if(len(class_dict[key]) > 1):
			matches.append(out_str)
		else:
			singles.append(out_str)

	full = sorted(full)
	matches = sorted(matches)
	singles = sorted(singles)

	# Uncomment if you want this file also
	"""
	with open(os.getcwd() + "/output/pledges_processed.txt", "w+") as f:
		for line in full:
			f.write(line)
			f.write('\n')
	"""
	with open(os.getcwd() + "/matches_processed.txt", "w+") as f:
		for line in matches:
			f.write(line)
			f.write('\n')
	
	with open(os.getcwd() + "/singles_processed.txt", "w+") as f:
		for line in singles:
			f.write(line)
			f.write('\n')
	
	# delete classes.txt
	os.remove(os.getcwd() + "/classes.txt")