from flask import Flask, render_template, flash, redirect, url_for, session, logging, request, send_from_directory
from flask_mysqldb import MySQL
from wtforms import Form, StringField, TextAreaField, PasswordField, validators
from passlib.hash import sha256_crypt
from functools import wraps
from itsdangerous import URLSafeTimedSerializer
import smtplib
import numpy as np
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import os
import zipfile
import processFiles

UPLOAD_FOLDER = os.getcwd()
ALLOWED_EXTENSIONS = set(['csv'])

app = Flask(__name__)

# Set up MySQL
app.config['MYSQL_HOST'] = '192.17.90.133'
app.config['MYSQL_USER'] = 'dpaez2_dpaez2'
app.config['MYSQL_PASSWORD'] = '.kh$ETfN-^7U'
app.config['MYSQL_DB'] = 'dpaez2_Academic_Calendar'
app.config['MYSQL_CURSORCLASS'] = 'DictCursor'
app.config['SESSION_TYPE'] = 'memcached'
app.config['SECRET_KEY'] = 'docpmoo10/10'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(file):
	return '.' in file and file.rsplit('.', 1)[1] in ALLOWED_EXTENSIONS

# open admin spreadsheet
scope = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']
credentials = ServiceAccountCredentials.from_json_keyfile_name('tri-uiuc-ac-e08f32932b2b.json', scope)
gc = gspread.authorize(credentials)

wks = gc.open('tri-uiuc-ac-admins').sheet1
def get_admins():
	num_admins = len(wks.col_values(1)) - 1
	# set up garbage values in case spreadsheet is empty
	ADMIN_NETID = ['bork123']
	ADMIN_NAME = ['XYZ']
	if num_admins > 0:
		ADMIN_NETID = wks.col_values(1)[1:]
		ADMIN_NAME = wks.col_values(2)[1:]
	return ADMIN_NETID, ADMIN_NAME

ADMIN_NETID, ADMIN_NAME = get_admins()

ts = URLSafeTimedSerializer(app.config["SECRET_KEY"])

# init MySQL
mysql = MySQL(app)

def lastCommitParse(s):
	tmp = s.split('-')
	tmp2 = tmp[2].split(' ')
	tmp3 = tmp2[1].split(':')
	hour = int(tmp3[0])
	m = 'AM' if hour < 12 else 'PM'
	if hour > 12:
		hour -= 12
	if hour == 0:
		hour = 12
	return "{:s}/{:s}/{:s} {:d}:{:s} {:s}".format(tmp[1], tmp2[0], tmp[0], hour, tmp3[1], m)

def drop(Grades, n):
	if n >= len(Grades[:,0]):
		return 0, 0
	else:
		score = sum(Grades[:,0])
		possible = sum(Grades[:,1])
		for i in range(1, n+1, 1):
			score -= np.partition(Grades, i - 1, axis=0)[i - 1][0]
			possible -= np.partition(Grades, i - 1, axis=0)[i - 1][1]
		return score, possible

def is_not_blocked(f):
	@wraps(f)
	def wrap(*args, **kwargs):
		cur = mysql.connection.cursor()
		cur.execute("SELECT blocked " +
					"FROM Users " +
					"WHERE netID=%s AND name=%s",
					[session['netid'], session['name']])
		blocked = cur.fetchall()[0]['blocked']
		mysql.connection.commit()
		cur.close()
		if not blocked:
			return f(*args, **kwargs)
		else:
			error = 'Check-In is going on at the moment, please wait.'
			session.clear()
			return render_template('home.html', error=error)
	return wrap

def is_check_in_not_happening(f):
	@wraps(f)
	def wrap(*args, **kwargs):
		cur = mysql.connection.cursor()
		cur.execute("SELECT SUM(blocked) AS num " +
					"FROM Users")
		numBlocks = cur.fetchall()[0]['num']
		mysql.connection.commit()
		cur.close()
		if not numBlocks:
			return f(*args, **kwargs)
		else:
			error = 'Check-In is going on at the moment, please wait.'
			return render_template('home.html', error=error)
	return wrap

# Home page
@app.route('/')
def Index():
	return render_template('home.html')

# About page
@app.route('/about')
def About():
	return render_template('about.html')

# Class used in register page
class RegisterForm(Form):
	name = StringField('Initials/Name (If pledge)', [validators.Length(min=1, max=50)])
	netid = StringField('NetID', [validators.Regexp(r'[a-z]+[0-9]+', message='Not NetID.')])
	password = PasswordField('Password', [
		validators.DataRequired(),
		validators.EqualTo('confirm', message='Passwords do not match.')
	])
	confirm = PasswordField('Confirm Password')

# Register page
@app.route('/register', methods=['GET', 'POST'])
@is_check_in_not_happening
def register():
	form = RegisterForm(request.form)
	if request.method == 'POST' and form.validate(): # form is correctly inputted
		name = form.name.data
		netid = form.netid.data
		password = sha256_crypt.encrypt(str(form.password.data))
		# Connect to DB
		cur = mysql.connection.cursor()
		result = cur.execute("SELECT * " +
							 "FROM Users " +
							 "WHERE netID=%s AND name=%s", [netid, name])
		if result > 0:
			error = "User exists with that NetID and name."
			mysql.connection.commit()
			cur.close()
			return render_template('register.html', form=form, error=error)
		else:
			# Add new user to DB
			cur.execute("INSERT INTO Users(netid, name, password) " +
						"VALUES(%s, %s, %s)", (netid, name, password))
			# Commit changes to DB
			mysql.connection.commit()
			cur.close()
			flash('You are now registered and can log in.', 'success')
			return redirect(url_for('login'))
	return render_template('register.html', form=form)

# Login page
@app.route('/login', methods=['GET','POST'])
def login():
	ADMIN_NETID, ADMIN_NAME = get_admins()
	if request.method == 'POST':
		netid = request.form['netid']
		password_candidate = request.form['password']
		# Connect to DB
		cur = mysql.connection.cursor()
		result = cur.execute("SELECT * " +
							 "FROM Users " +
							 "WHERE netID = %s", [netid])
		if result > 0:  # User is found
			data = cur.fetchone()
			password = data['password']
			cur.execute("SELECT SUM(blocked) AS num " +
						"FROM Users")
			numBlocks = cur.fetchall()[0]['num']
			if (sha256_crypt.verify(password_candidate, password) and not numBlocks) or (sha256_crypt.verify(password_candidate, password) and numBlocks and (data['name'] in ADMIN_NAME) and (netid in ADMIN_NETID)): # password works and check-in is not happening
				session['logged_in'] = True
				session['name'] = data['name']
				session['netid'] = netid
				flash('You are now logged in. Welcome, ' + session['name'] + '.', 'success')
				mysql.connection.commit()
				cur.close()
				if (session['netid'] in ADMIN_NETID) and (session['name'] in ADMIN_NAME):
					session['admin'] = True
				return redirect(url_for('myclasses'))
			else: # password does not work
				if numBlocks: # check-in is happening
					error = 'Check-In is going on at the moment, please wait.'
					return render_template('home.html', error=error)
				error = 'Invalid login.'
				mysql.connection.commit()
				cur.close()
				return render_template('login.html', error=error)
			mysql.connection.commit()
			cur.close()
		else: # user not found
			error = 'NetID not found.'
			mysql.connection.commit()
			cur.close()
			return render_template('login.html', error=error)
	return render_template('login.html')

def is_logged_in(f):
	@wraps(f)
	def wrap(*args, **kwargs):
		if 'logged_in' in session:
			return f(*args, **kwargs)
		else:
			flash('Unauthorized, please login.', 'danger')
			return redirect(url_for('login'))
	return wrap

def is_admin(f):
	@wraps(f)
	def wrap(*args, **kwargs):
		if 'admin' in session:
			return f(*args, **kwargs)
		else:
			flash('You are not an administrator.', 'danger')
			return redirect(url_for('login'))
	return wrap

@app.route('/administration/classSurveyResults/Export')
@is_logged_in
@is_admin
def export_class_survey_results():
	return send_from_directory(os.getcwd() + '/static', 'class_survey_responses.csv', as_attachment=True)

@app.route('/administration/classSurveyResults')
@is_logged_in
@is_admin
def survey_results(message=""):
	survey = processFiles.getSurveyResponses()
	entries = True if len(survey) != 0 else False
	time_setting = processFiles.semesterParse()
	if message:
		return render_template('surveyResults.html', 
			survey=survey, 
			entries=entries, 
			submissionTimestampParse=lastCommitParse, 
			time_setting=time_setting,
			msg=message)
	else:
		return render_template('surveyResults.html', 
			survey=survey, 
			entries=entries, 
			submissionTimestampParse=lastCommitParse, 
			time_setting=time_setting)

@app.route('/administration/classSurveyResults/deleteSurveyResponse/<string:timestamp>/<string:personName>/<string:classes>', methods = ['GET', 'POST'])
@is_logged_in
@is_admin
def delete_survey_response_entry(timestamp, personName, classes):
	if request.method == "POST":
		processFiles.deleteSurveyResponseEntry(timestamp, personName, classes)
		msg = 'Survey response entry has been deleted.'
		return redirect(url_for('survey_results', message=msg))
	else:
		return render_template('maybeDeleteSurveyEntry.html')

@app.route('/administration/classSurveyResults/clearResults', methods = ['GET', 'POST'])
@is_logged_in
@is_admin
def clear_survey_results():
	if request.method == "POST":
		processFiles.clearSurveyResults()
		flash('Survey entries have been cleared.', 'danger')
		return redirect(url_for('survey_results'))
	else:
		return render_template('maybeClearSurveyResults.html')

@app.route('/classSurvey', methods = ['GET', 'POST'])
def class_survey():
	if request.method == "POST":
		data = request.form
		personName = data["personName"].strip().upper() if (len(data["personName"]) == 3) else data["personName"].strip()
		
		classes = ""
		for i in range(1, int(data['numClasses']) + 1):
			if len(data['classLabel' + str(i)].strip()) == 0:
				classes += (data['classSubject' + str(i)].strip() + " " + data['classNum' + str(i)].strip())
			else:
				classes += (data['classSubject' + str(i)].strip() + " " + data['classNum' + str(i)].strip() + " " + data['classLabel' + str(i)].strip())
			if i != int(data['numClasses']):
				classes += ", "

		processFiles.writeResponse(personName, classes)

		msg = "Response successfully recorded!"
		return render_template('survey.html', msg=msg)
	else:
		return render_template('survey.html')

@app.route('/administration/ProcessSurveyResponses/administrationFileSuccess')
@is_logged_in
@is_admin
def fileSuccess():
	zipf = zipfile.ZipFile('output_files.zip','w', zipfile.ZIP_DEFLATED)
	zipf.write('matches_processed.txt')
	zipf.write('singles_processed.txt')
	zipf.close()
	return send_from_directory(os.getcwd(), 'output_files.zip', as_attachment=True)

# admin process survey responses page
@app.route('/administration/ProcessSurveyResponses', methods = ['GET', 'POST'])
@is_logged_in
@is_admin
def administrationProcessResponses():
	if request.method == 'POST':
		if request.files:
			f = request.files['file']
			if f and allowed_file(f.filename):
				f.save(f.filename)
				processFiles.processCSV(f.filename)
				return redirect(url_for('fileSuccess'))
			else:
				err = 'Your file is not a csv.'
				return render_template('administrationProcessSurveyResponses.html', err=err)
		else:
			err = 'You did not upload a file at all.'
			return render_template('administrationProcessSurveyResponses.html', err=err)
	else:
		return render_template('administrationProcessSurveyResponses.html')

# admin page
@app.route('/administration')
@is_logged_in
@is_admin
def administration():
	cur = mysql.connection.cursor()
	cur.execute("SELECT netID, name, blocked, last_commit " +
				"FROM Users ")
	users = cur.fetchall()
	mysql.connection.commit()
	cur.close()
	return render_template('administration.html', users=users, lastCommitParse=lastCommitParse)

# admin is viewing a week for a user's planner
@app.route('/administration/<string:userNetID>/<string:userName>/planner/week<string:week>')
@is_logged_in
@is_admin
def administrationUserPlannerWeekX(userNetID, userName, week):
	cur = mysql.connection.cursor()
	cur.execute("SELECT subject, courseNum, courseName, category, attributeName, dueDate " +
				"FROM Attributes " +
				"WHERE netID=%s AND week=%s",
				[userNetID, week])
	Items = cur.fetchall()
	mysql.connection.commit()
	cur.close()
	return render_template('administrationUserPlannerWeekX.html', Items=Items, week=week, userName=userName)

# admin select week to view for user's planner
@app.route('/administration/<string:userNetID>/<string:userName>/planner', methods=["GET", "POST"])
@is_logged_in
@is_admin
def administrationUserPlanner(userNetID, userName):
	if request.method == "POST":
		week = request.form.get('weeks')
		return redirect(url_for('administrationUserPlannerWeekX', week=week, userNetID=userNetID, userName=userName))
	return render_template('administrationWeekChart.html', userName=userName)

# admin chooses between user's classes or planner
@app.route('/administration/<string:userNetID>/<string:userName>/portfolio')
@is_logged_in
@is_admin
def administrationChoose(userNetID, userName):
	return render_template('administrationChoose.html', userNetID=userNetID, userName=userName)

# admin executes check-in
@app.route('/administrationCheckIn')
@is_logged_in
@is_admin
def administrationCheckIn():
	ADMIN_NETID, ADMIN_NAME = get_admins()
	cur = mysql.connection.cursor()
	query = "UPDATE Users SET blocked=TRUE WHERE "
	for i in range(len(ADMIN_NETID)):
		if i != (len(ADMIN_NETID) - 1):
			query += "netID<>'" + ADMIN_NETID[i] + "' AND "
		else:
			query += "netID<>'" + ADMIN_NETID[i] + "'"
	cur.execute(query)
	cur.execute("SELECT netID, name, blocked, last_commit " +
				"FROM Users ")
	users = cur.fetchall()
	mysql.connection.commit()
	cur.close()
	msg = 'Check-In has been executed.'
	return render_template('administration.html', users=users, msg=msg, lastCommitParse=lastCommitParse)

# admin undos check-in
@app.route('/administrationUndoCheckIn')
@is_logged_in
@is_admin
def administrationUndoCheckIn():
	cur = mysql.connection.cursor()
	cur.execute("UPDATE Users " +
				"SET blocked=FALSE")
	cur.execute("SELECT netID, name, blocked, last_commit " +
				"FROM Users ")
	users = cur.fetchall()
	mysql.connection.commit()
	cur.close()
	msg = 'Check-In has been undone.'
	return render_template('administration.html', users=users, msg=msg, lastCommitParse=lastCommitParse)

# admin clicks on user to see user's classes
@app.route('/administration/<string:userNetID>/<string:userName>/classes')
@is_logged_in
@is_admin
def administrationUserClasses(userNetID, userName):
	classes = []
	# Connect to DB
	cur = mysql.connection.cursor()
	cur.execute("SELECT subject, courseNum, courseName, weighted " +
				"FROM Classes " +
				"WHERE netID=%s",
				[userNetID])
	for row in cur.fetchall():
		classes.append({
			'subject': row['subject'],
			'courseNum': row['courseNum'],
			'courseName': row['courseName'],
			'weighted': row['weighted']
		})
	# Commit changes to DB
	mysql.connection.commit()
	cur.close()
	return render_template('administrationUserClasses.html',
						   classes=classes,
						   userNetID=userNetID,
						   userName=userName)

# admin checks out user's class
@app.route('/administration/<string:userNetID>/<string:userName>/classes/<string:userClassSubject>-<string:userClassCourseNum>/<string:userClassCourseName>')
@is_logged_in
@is_admin
def administrationUserClass(userNetID, userName, userClassSubject, userClassCourseNum, userClassCourseName):
	cur = mysql.connection.cursor()
	cur.execute("SELECT weighted " +
				"FROM Classes " +
				"WHERE netID=%s AND subject=%s AND courseNum=%s AND courseName=%s",
				[userNetID, userClassSubject, userClassCourseNum, userClassCourseName])
	weighted = cur.fetchall()[0]['weighted']
	atLeastOneAttribute = False
	cur.execute("SELECT category, weight, drops " +
				"FROM Weights " +
				"WHERE netID=%s AND subject=%s AND courseNum=%s AND courseName=%s",
				[userNetID, userClassSubject, userClassCourseNum, userClassCourseName])
	categories = cur.fetchall()
	categoryData = []
	for category in categories:
		cur.execute("SELECT attributeName, score, total " +
					"FROM Attributes " +
					"WHERE netID=%s AND subject=%s AND courseNum=%s AND courseName=%s AND category=%s",
					[userNetID, userClassSubject, userClassCourseNum, userClassCourseName, category['category']])
		attributes = cur.fetchall()
		if attributes:
			v = []
			for attribute in attributes:
				atLeastOneAttribute = True
				v.append([attribute['score'], attribute['total']])
			v = np.array(v)
			totalScored, totalPossible = drop(v, category['drops'])
			categoryData.append({
				'categoryName': category['category'],
				'attributes': attributes,
				'totalScored': totalScored,
				'totalPossible': totalPossible,
				'weight': category['weight'],
				'drops': category['drops']
			})
		else:
			categoryData.append({
				'categoryName': category['category'],
				'attributes': attributes,
				'totalScored': 0,
				'totalPossible': 0,
				'weight': category['weight'],
				'drops': category['drops']
			})
	mysql.connection.commit()
	cur.close()
	return render_template('administrationUserClass.html',
						   subject=userClassSubject,
						   courseNum=userClassCourseNum,
						   courseName=userClassCourseName,
						   weighted=weighted,
						   categoryData=categoryData,
						   atLeastOneAttribute=atLeastOneAttribute,
						   userNetID=userNetID,
						   userName=userName
						   )

# admin tries to see user's computed grade
@app.route('/administration/<string:userNetID>/<string:userName>/classes/<string:userClassSubject>-<string:userClassCourseNum>/<string:userClassCourseName>/calculateGrade/<string:userWeighted>')
@is_logged_in
@is_admin
def administrationCalculateGrade(userNetID, userName, userClassSubject, userClassCourseNum, userClassCourseName, userWeighted):
	cur = mysql.connection.cursor()
	cur.execute("SELECT weighted " +
				"FROM Classes " +
				"WHERE netID=%s AND subject=%s AND courseNum=%s AND courseName=%s",
				[userNetID, userClassSubject, userClassCourseNum, userClassCourseName])
	weighted = cur.fetchall()[0]['weighted']
	cur.execute("SELECT category, weight, drops " +
				"FROM Weights " +
				"WHERE netID=%s AND subject=%s AND courseNum=%s AND courseName=%s",
				[userNetID, userClassSubject, userClassCourseNum, userClassCourseName])
	categories = cur.fetchall()
	categoryData = []
	totalScoredVec = []
	totalPossibleVec = []
	sum_ = 0
	sumOfWeights = 0
	for category in categories:
		cur.execute("SELECT attributeName, score, total " +
					"FROM Attributes " +
					"WHERE netID=%s AND subject=%s AND courseNum=%s AND courseName=%s AND category=%s",
					[session['netid'], userClassSubject, userClassCourseNum, userClassCourseName, category['category']])
		attributes = cur.fetchall()
		if attributes:
			v = []
			for attribute in attributes:
				v.append([attribute['score'], attribute['total']])
			v = np.array(v)
			totalScored, totalPossible = drop(v, category['drops'])
			categoryData.append({
				'categoryName': category['category'],
				'attributes': attributes,
				'totalScored': totalScored,
				'totalPossible': totalPossible,
				'weight': category['weight']
			})
		else:
			categoryData.append({
				'categoryName': category['category'],
				'attributes': attributes,
				'totalScored': 0,
				'totalPossible': 0,
				'weight': category['weight']
			})
		if weighted:
			sumOfWeights += category['weight']
			if not attributes or totalPossible == 0:
				continue
			sum_ += (1.0*totalScored/totalPossible)*category['weight']
		else:
			totalScoredVec.append(totalScored)
			totalPossibleVec.append(totalPossible)
	mysql.connection.commit()
	cur.close()
	grade = 0
	if weighted:
		grade = sum_
	elif sum(totalPossibleVec):
		grade = 100.0*sum(totalScoredVec)/sum(totalPossibleVec)
	else:
		grade = 0
	if weighted and sumOfWeights != 100:
		flash('Weights do not add up to 100%.', 'danger')
		return redirect(url_for('administrationUserClass',
								userNetID=userNetID,
								userName=userName,
								userClassSubject=userClassSubject,
								userClassCourseNum=userClassCourseNum,
								userClassCourseName=userClassCourseName))
	return render_template('calculateGrade.html',
						   grade=grade,
						   weighted=weighted)

# Logout button
@app.route('/logout')
def logout():
	session.clear()
	flash('You have been logged out.', 'success')
	return redirect(url_for('login'))

# Class used for forgot password page
class netIDForgotPasswordForm(Form):
	netID = StringField('NetID', [validators.Regexp(r'[a-z]+[0-9]+', message='Not NetID.')])

# forgot password page
@app.route('/forgot', methods=['GET','POST'])
@is_check_in_not_happening
def forgot():
	form = netIDForgotPasswordForm(request.form)
	if request.method == 'POST' and form.validate(): # form inputted is correct
		netID = form.netID.data
		cur = mysql.connection.cursor()
		result = cur.execute("SELECT * " +
							 "FROM Users " +
							 "WHERE netID = %s", [netID])
		mysql.connection.commit()
		cur.close()
		if result > 0:  # User is found
			gmail_user = 'tri.uiuc.academiccalendar@gmail.com'
			gmail_password = 'sickle97'
			email = netID + '@illinois.edu'
			subject = "Academic Calendar: Password Reset Request"
			token = ts.dumps(email, salt='recover-key')
			recover_url = url_for(
				'reset_with_token',
				token=token,
				netID=netID,
				_external=True)
			html = render_template(
				'recoveryEmail.html',
				recover_url=recover_url)
			message = 'Subject: {}\n\n{}'.format(subject, html)
			server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
			server.ehlo()
			server.login(gmail_user, gmail_password)
			server.sendmail(gmail_user, email, message)
			server.close()
			return render_template('forgotEmailSent.html', netID=netID)
		else:
			error = 'User not found.'
			return render_template('forgot.html', form=form, error=error)
	return render_template('forgot.html', form=form)

class changePasswordEmail(Form):
	newPassword = PasswordField('Password', validators=[validators.DataRequired()])

# user clicks link emailed to them to reset password
@app.route('/reset/<token>/<string:netID>', methods=["GET", "POST"])
def reset_with_token(token, netID):
	try:
		email = ts.loads(token, salt="recover-key", max_age=86400)
	except:
		return render_template('err404.html')
	form = changePasswordEmail(request.form)
	if form.validate():
		newPassword = sha256_crypt.encrypt(str(form.newPassword.data))
		# Connect to DB
		cur = mysql.connection.cursor()
		# Update new password to DB
		cur.execute("UPDATE Users " +
					"SET password=%s " +
					"WHERE netID=%s",
					[newPassword, netID])
		# Commit changes to DB
		mysql.connection.commit()
		cur.close()
		flash('Password has been changed.', 'success')
		return redirect(url_for('login'))
	return render_template('reset_with_token.html', form=form, token=token, netID=netID)

@app.route('/updates')
def updates():
	return render_template('updates.html')

# user tries to delete an item
@app.route('/myplanner/week<string:week>/Delete/<string:subject>-<string:courseNum>/<string:courseName>/<string:category>/<string:attributeName>', methods=["GET", "POST"])
@is_not_blocked
@is_logged_in
def maybeDeleteItem(week, subject, courseNum, courseName, category, attributeName):
	if request.method == "POST":
		cur = mysql.connection.cursor()
		cur.execute("DELETE FROM Attributes " +
					"WHERE netID=%s AND subject=%s AND courseNum=%s AND courseName=%s AND category=%s AND attributeName=%s AND week=%s",
					[session['netid'], subject, courseNum, courseName, category, attributeName, week])
		mysql.connection.commit()
		cur.close()
		flash('"' + attributeName + '"' + ' item has been removed.', 'success')
		return redirect(url_for('myPlannerWeekX', week=week))
	return render_template('maybeDeleteItem.html')

# user tries to edit date of item
@app.route('/myplanner/week<string:week>/EditDueDate/<string:subject>-<string:courseNum>/<string:courseName>/<string:category>/<string:attributeName>', methods=["GET", "POST"])
@is_not_blocked
@is_logged_in
def editDueDate(week, subject, courseNum, courseName, category, attributeName):
	if request.method == "POST":
		newDueDate = request.form.get('months')+'-'+request.form.get('days')
		cur = mysql.connection.cursor()
		cur.execute("UPDATE Attributes " +
					"SET dueDate=%s " +
					"WHERE netID=%s AND subject=%s AND courseNum=%s AND courseName=%s AND category=%s AND attributeName=%s AND week=%s",
					[session['netid'], subject, courseNum, courseName, category, attributeName, week])
		mysql.connection.commit()
		cur.close()
		flash('Due date has been modified.', 'success')
		return redirect(url_for('myPlannerWeekX', week=week))

# user goes to specific week in planner
@app.route('/myplanner/week<string:week>')
@is_not_blocked
@is_logged_in
def myPlannerWeekX(week):
	cur = mysql.connection.cursor()
	cur.execute("SELECT subject, courseNum, courseName, category, attributeName, dueDate " +
				"FROM Attributes " +
				"WHERE netID=%s AND week=%s",
				[session['netid'], week])
	Items = cur.fetchall()
	mysql.connection.commit()
	cur.close()
	return render_template('myPlannerWeekX.html', Items=Items, week=week)

# user tries to see their planner
@app.route('/myplanner', methods=["POST", "GET"])
@is_not_blocked
@is_logged_in
def myPlanner():
	if request.method == "POST":
		week = request.form.get('weeks')
		return redirect(url_for('myPlannerWeekX', week=week))
	return render_template('weekChart.html')

# my profile page
@app.route('/myprofile')
@is_not_blocked
@is_logged_in
def myProfile():
	return render_template('profile.html', name=session['name'], netid=session['netid'])

class editProfileForm(Form):
	newName = StringField('Initials/Name (If pledge)', [validators.Length(min=1, max=50)])
	newNetID = StringField('NetID', [validators.Regexp(r'[a-z]+[0-9]+', message='Not NetID.')])

# user tries to edit profile
@app.route('/myprofile/edit', methods=['GET', 'POST'])
@is_not_blocked
@is_logged_in
def editProfile():
	ADMIN_NETID, ADMIN_NAME = get_admins()
	form = editProfileForm(request.form)
	if request.method == 'POST' and form.validate(): # form is correctly inputted
		newName = form.newName.data
		newNetID = form.newNetID.data
		# Connect to DB
		cur = mysql.connection.cursor()
		result = cur.execute("SELECT * " +
							 "FROM Users " +
							 "WHERE netID=%s AND name=%s", [newNetID, newName])
		if result > 0:
			error = "User exists with that NetID and name."
			mysql.connection.commit()
			cur.close()
			return render_template('editProfile.html', form=form, error=error)
		else:
			# Update profile to DB
			cur.execute("UPDATE Users " +
						"SET netID=%s, name=%s " +
						"WHERE netID=%s AND name=%s",
						(newNetID, newName, session['netid'], session['name']))
			# Commit changes to DB
			mysql.connection.commit()
			cur.close()
			session['netid'] = newNetID
			session['name'] = newName
			if (session['netid'] in ADMIN_NETID) and (session['name'] in ADMIN_NAME):
				session['admin'] = True
			else:
				session['admin'] = False
			flash('Profile has been modified.', 'success')
			return redirect(url_for('myProfile'))
	return render_template('editProfile.html', form=form)

class changePasswordForm(Form):
	newPassword = PasswordField('New Password', [
		validators.DataRequired(),
		validators.EqualTo('confirmPassword', message='Passwords do not match.')
	])
	confirmPassword = PasswordField('Confirm New Password')

# user tries to change password
@app.route('/myprofile/changePW', methods=['GET', 'POST'])
@is_not_blocked
@is_logged_in
def changePassword():
	form = changePasswordForm(request.form)
	if request.method == 'POST' and form.validate(): # form is correctly inputted
		newPassword = sha256_crypt.encrypt(str(form.newPassword.data))
		# Connect to DB
		cur = mysql.connection.cursor()
		# Update new password to DB
		cur.execute("UPDATE Users " +
					"SET password=%s " +
					"WHERE netID=%s AND name=%s",
					[newPassword, session['netid'], session['name']])
		# Commit changes to DB
		mysql.connection.commit()
		cur.close()
		flash('Password has been changed.', 'success')
		return redirect(url_for('myProfile'))
	return render_template('editPassword.html', form=form)

# User's classes page
@app.route('/myclasses')
@is_not_blocked
@is_logged_in
def myclasses():
	classes = []
	# Connect to DB
	cur = mysql.connection.cursor()
	cur.execute("SELECT subject, courseNum, courseName, weighted " +
				"FROM Classes " +
				"WHERE netID=%s", [session['netid']])
	for row in cur.fetchall():
		classes.append({
			'subject': row['subject'],
			'courseNum': row['courseNum'],
			'courseName': row['courseName'],
			'weighted': row['weighted']
		})
	# Commit changes to DB
	mysql.connection.commit()
	cur.close()
	return render_template('myclasses.html', classes=classes)

# User clicks on class link
@app.route('/myclasses/<string:name>/<string:cName>')
@is_not_blocked
@is_logged_in
def mySchoolClass(name,cName):
	subject = name[:name.index('-')]
	courseNum = name[name.index('-')+1:]
	cur = mysql.connection.cursor()
	cur.execute("SELECT weighted " +
				"FROM Classes " +
				"WHERE netID=%s AND subject=%s AND courseNum=%s AND courseName=%s",
				[session['netid'], subject, courseNum, cName])
	weighted = cur.fetchall()[0]['weighted']
	atLeastOneAttribute = False
	cur.execute("SELECT category, weight, drops " +
							 "FROM Weights " +
							 "WHERE netID=%s AND subject=%s AND courseNum=%s AND courseName=%s",
							 [session['netid'], subject, courseNum, cName])
	categories = cur.fetchall()
	categoryData = []
	for category in categories:
		cur.execute("SELECT attributeName, score, total " +
					"FROM Attributes " +
					"WHERE netID=%s AND subject=%s AND courseNum=%s AND courseName=%s AND category=%s",
					[session['netid'], subject, courseNum, cName, category['category']])
		attributes = cur.fetchall()
		if attributes:
			v = []
			for attribute in attributes:
				atLeastOneAttribute = True
				v.append([attribute['score'], attribute['total']])
			v = np.array(v)
			totalScored, totalPossible = drop(v, category['drops'])
			categoryData.append({
				'categoryName': category['category'],
				'attributes': attributes,
				'totalScored': totalScored,
				'totalPossible': totalPossible,
				'weight': category['weight'],
				'drops': category['drops']
			})
		else:
			categoryData.append({
				'categoryName': category['category'],
				'attributes': attributes,
				'totalScored': 0,
				'totalPossible': 0,
				'weight': category['weight'],
				'drops': category['drops']
			})
	mysql.connection.commit()
	cur.close()
	return render_template('class.html',
						   subject=subject,
						   courseNum=courseNum,
						   courseName=cName,
						   weighted=weighted,
						   categoryData=categoryData,
						   atLeastOneAttribute=atLeastOneAttribute
						   )

class addClassForm(Form):
	courseNum = StringField('Course Number', [
		validators.Regexp(r'[1-9][0-9][0-9]', message='Not a course number.'),
		validators.Length(min=3, max=3, message='Field must be 3 numbers long.')])
	courseName = StringField('Course Name', [validators.DataRequired()])

# User tries to add class
@app.route('/myclasses/addclass', methods=['GET','POST'])
@is_not_blocked
@is_logged_in
def addClass():
	form = addClassForm(request.form)
	if request.method == 'POST' and form.validate():  # form is correctly inputted
		courseNum = form.courseNum.data
		courseName = form.courseName.data
		subject = request.form.get('subjects')
		weighted = True if (request.form.get('weighted') == "1") else False
		netid = session['netid']
		# Connect to DB
		cur = mysql.connection.cursor()
		result = cur.execute("SELECT * " +
							 "FROM Classes " +
							 "WHERE courseNum=%s AND subject=%s AND netID=%s AND courseName=%s AND weighted=%s",
							 [courseNum, subject, netid, courseName, weighted])
		if result > 0:
			if weighted:
				error = subject + courseNum + ": " + courseName + " (Weighted) is already in your list of classes."
				mysql.connection.commit()
				cur.close()
				return render_template('addclass.html', error=error, form=form)
			else:
				error = subject + courseNum + ": " + courseName + " (Not Weighted) is already in your list of classes."
				mysql.connection.commit()
				cur.close()
				return render_template('addclass.html', error=error, form=form)
		else:
			# Add new class to DB
			cur.execute("INSERT INTO Classes(netID, subject, courseNum, courseName, weighted) " +
						"VALUES(%s, %s, %s, %s, %s)", [netid, subject, courseNum, courseName, weighted])
			# Commit changes to DB
			mysql.connection.commit()
			cur.close()
			flash(subject + courseNum + ": " + courseName + ' has been added to your list of classes.', 'success')
			return redirect(url_for('myclasses'))
	return render_template('addclass.html', form=form)

class editClassForm(Form):
	courseNum = StringField('Course Number', [
		validators.Regexp(r'[1-9][0-9][0-9]', message='Not a course number.'),
		validators.Length(min=3, max=3, message='Field must be 3 numbers long.')])
	courseName = StringField('Course Name', [validators.DataRequired()])

# User tries to edit a class
@app.route('/myclasses/edit/<string:oldCourse>/<string:oldCourseName>/<string:oldWeighted>', methods=['GET', 'POST'])
@is_not_blocked
@is_logged_in
def editClass(oldCourse, oldCourseName, oldWeighted):
	form = editClassForm(request.form)
	if request.method == 'POST':
		oldSubject = oldCourse[:oldCourse.index('-')]
		oldCourseNum = oldCourse[oldCourse.index('-') + 1:]
		courseNum = form.courseNum.data
		courseName = form.courseName.data
		subject = request.form.get('subjects')
		weighted = True if (request.form.get('weighted') == "1") else False
		# Connect to DB
		cur = mysql.connection.cursor()
		result = cur.execute("SELECT * " +
							 "FROM Classes " +
							 "WHERE netID=%s AND subject=%s AND courseNum=%s AND courseName=%s AND weighted=%s",
							 [session['netid'], subject, courseNum, courseName, weighted])
		if result > 0:
			if weighted:
				error = subject + courseNum + ": " + courseName + " (Weighted) is already in your list of classes."
				mysql.connection.commit()
				cur.close()
				return render_template('addclass.html', error=error, form=form)
			else:
				error = subject + courseNum + ": " + courseName + " (Not Weighted) is already in your list of classes."
				mysql.connection.commit()
				cur.close()
				return render_template('addclass.html', error=error, form=form)
		cur.execute("UPDATE Classes " +
					"SET subject=%s, courseNum=%s, courseName=%s, weighted=%s " +
					"WHERE netID=%s AND subject=%s AND courseNum=%s AND courseName=%s AND weighted=%s",
					[subject, courseNum, courseName, weighted,
					 session['netid'], oldSubject, oldCourseNum, oldCourseName, oldWeighted])
		# edit goes through
		mysql.connection.commit()
		cur.close()
		flash('Class has been modified.', 'success')
		return redirect(url_for('myclasses'))
	return render_template('editClass.html', form=form)

# User tries to delete a class
@app.route('/myclasses/delete/<string:course>/<string:cName>/<string:weighted>', methods=['GET', 'POST'])
@is_not_blocked
@is_logged_in
def deleteClass(course, cName, weighted):
	subject = course[:course.index('-')]
	courseNum = course[course.index('-') + 1:]
	if request.method == 'POST':
		# connect to DB
		cur = mysql.connection.cursor()
		cur.execute('DELETE FROM Classes ' +
					'WHERE netID=%s AND subject=%s AND courseNum=%s AND courseName=%s AND weighted=%s',
					[session['netid'], subject, courseNum, cName, weighted])
		# delete goes through
		mysql.connection.commit()
		cur.close()
		flash(subject + courseNum + ": " + cName + ' has been removed.', 'success')
		return redirect(url_for('myclasses'))
	return render_template('maybeDelete.html', subject=subject, courseNum=courseNum, courseName=cName)

class addAttributeForm(Form):
	attributeName = StringField('Name of Attribute', [validators.DataRequired()])
	score = StringField('Score', [validators.Regexp(r'[0-9]+(.|)[0-9]*', message='Not a number.')])
	total = StringField('Out Of', [validators.Regexp(r'[0-9]+(.|)[0-9]*', message='Not a number.')])

# User tries to add attribute
@app.route('/myclasses/<string:name>/<string:cName>/Add<string:category>', methods=['GET','POST'])
@is_not_blocked
@is_logged_in
def addAttribute(name, cName, category):
	form = addAttributeForm(request.form)
	if request.method == 'POST' and form.validate():  # form is correctly inputted
		subject = name[:name.index('-')]
		courseNum = name[name.index('-') + 1:]
		score = form.score.data
		total = form.total.data
		dueDate = request.form.get('months')+'-'+request.form.get('days')
		week = request.form.get('weeks')
		if float(form.score.data) > float(form.total.data):
			flash('Score is greater than total.', 'danger')
			return render_template('addAttribute.html', form=form, category=category)
		attributeName = form.attributeName.data
		# Connect to DB
		cur = mysql.connection.cursor()
		result = cur.execute("SELECT * " +
							 "FROM Attributes " +
							 "WHERE netID=%s AND subject=%s AND courseNum=%s AND courseName=%s AND category=%s AND attributeName=%s",
							 [session['netid'], subject, courseNum, cName, category, attributeName])
		if result > 0: # duplicates exist
			error = '"' + category + '" attribute "' + attributeName + '" already exists.'
			mysql.connection.commit()
			cur.close()
			return render_template('addAttribute.html', error=error, form=form)
		# Add new attribute to DB
		cur.execute("INSERT INTO Attributes(netID, subject, courseNum, courseName, category, attributeName, score, total, dueDate, week) " +
					"VALUES(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
					[session['netid'], subject, courseNum, cName, category, attributeName ,score, total, dueDate, week])
		# Commit changes to DB
		mysql.connection.commit()
		cur.close()
		flash('New "' + category + '" attribute has been added.', 'success')
		return redirect(url_for('mySchoolClass', name=name, cName=cName))
	return render_template('addAttribute.html', form=form, category=category)

class editAttributeNameForm(Form):
	attributeName = StringField('Name of Attribute', [validators.DataRequired()])

# User tries to edit attribute Name
@app.route('/myclasses/<string:name>/<string:cName>/Edit<string:category>/<string:oldAttributeName>/Name', methods=['GET','POST'])
@is_not_blocked
@is_logged_in
def editAttributeName(name, cName, category, oldAttributeName):
	form = editAttributeNameForm(request.form)
	if request.method == 'POST' and form.validate():  # form is correctly inputted
		subject = name[:name.index('-')]
		courseNum = name[name.index('-') + 1:]
		attributeName = form.attributeName.data
		# Connect to DB
		cur = mysql.connection.cursor()
		result = cur.execute("SELECT * " +
							 "FROM Attributes " +
							 "WHERE netID=%s AND subject=%s AND courseNum=%s AND courseName=%s AND category=%s AND attributeName=%s",
							 [session['netid'], subject, courseNum, cName, category, attributeName])
		if result > 0:  # duplicates exist
			error = '"' + category + '" attribute "' + attributeName + '" already exists.'
			mysql.connection.commit()
			cur.close()
			return render_template('editAttributeName.html', error=error, form=form)
		# Change name of attribute to DB
		cur.execute("UPDATE Attributes " +
					"SET attributeName=%s " +
					"WHERE netID=%s AND subject=%s AND courseNum=%s AND courseName=%s AND category=%s AND attributeName=%s",
					[attributeName, session['netid'], subject, courseNum, cName, category, oldAttributeName])
		# Commit changes to DB
		mysql.connection.commit()
		cur.close()
		flash('"' + category + '" attribute "' + oldAttributeName + '" has been renamed to ' + attributeName + '.', 'success')
		return redirect(url_for('mySchoolClass', name=name, cName=cName))
	return render_template('editAttributeName.html', form=form, category=category)

class editAttributeNumbersForm(Form):
	score = StringField('Score', [validators.Regexp(r'[0-9]+(.|)[0-9]*', message='Not a number.')])
	total = StringField('Out Of', [validators.Regexp(r'[0-9]+(.|)[0-9]*', message='Not a number.')])

# User tries to edit attribute numbers
@app.route('/myclasses/<string:name>/<string:cName>/Edit<string:category>/<string:attributeName>/<string:oldScore>-<string:oldTotal>/Numbers', methods=['GET','POST'])
@is_not_blocked
@is_logged_in
def editAttributeNumbers(name, cName, category, attributeName, oldScore, oldTotal):
	form = editAttributeNumbersForm(request.form)
	if request.method == 'POST' and form.validate():  # form is correctly inputted
		subject = name[:name.index('-')]
		courseNum = name[name.index('-') + 1:]
		score = form.score.data
		total = form.total.data
		if float(form.score.data) > float(form.total.data):
			flash('Score is greater than total.', 'danger')
			return render_template('editAttributeNumbers.html', form=form, category=category)
		# Connect to DB
		cur = mysql.connection.cursor()
		# Change numbers of attribute to DB
		cur.execute("UPDATE Attributes " +
					"SET score=%s, total=%s " +
					"WHERE netID=%s AND subject=%s AND courseNum=%s AND courseName=%s AND category=%s AND attributeName=%s AND score=%s AND total=%s",
					[score, total, session['netid'], subject, courseNum, cName, category, attributeName ,oldScore, oldTotal])
		# Commit changes to DB
		mysql.connection.commit()
		cur.close()
		flash('"' + category + '" attribute "' + attributeName + '"' + chr(39) + 's numbers has been modified.', 'success')
		return redirect(url_for('mySchoolClass', name=name, cName=cName))
	return render_template('editAttributeNumbers.html', form=form, category=category)

@app.route('/myclasses/<string:name>/<string:cName>/Delete<string:category>/<string:attributeName>/<string:score>-<string:total>', methods=['GET','POST'])
@is_not_blocked
@is_logged_in
def deleteAttribute(name, cName, category, attributeName, score, total):
	subject = name[:name.index('-')]
	courseNum = name[name.index('-') + 1:]
	if request.method == 'POST':
		# connect to DB
		cur = mysql.connection.cursor()
		cur.execute('DELETE FROM Attributes ' +
					'WHERE netID=%s AND subject=%s AND courseNum=%s AND courseName=%s AND category=%s AND attributeName=%s AND score=%s AND total=%s',
					[session['netid'], subject, courseNum, cName, category, attributeName, score, total])
		# delete goes through
		mysql.connection.commit()
		cur.close()
		flash('"' + attributeName + '"' + ' attribute has been removed.', 'success')
		return redirect(url_for('mySchoolClass', name=name, cName=cName))
	return render_template('maybeDeleteAttribute.html', attributeName=attributeName, category=category)

class addCategoryNoWeightForm(Form):
	categoryName = StringField('Category Name', [validators.DataRequired()])
	drops = StringField('Number of Drops', [validators.Regexp(r'[0-9]+', message='Not a number.')])

# User tries to add category (no weight)
@app.route('/myclasses/<string:name>/<string:cName>/addCategory/NoWeight', methods=['GET','POST'])
@is_not_blocked
@is_logged_in
def addCategoryNoWeight(name, cName):
	form = addCategoryNoWeightForm(request.form)
	if request.method == 'POST' and form.validate():  # form is correctly inputted
		subject = name[:name.index('-')]
		courseNum = name[name.index('-') + 1:]
		category = form.categoryName.data
		drops = int(form.drops.data)
		weight = -1
		# connect to DB
		cur = mysql.connection.cursor()
		result = cur.execute("SELECT * " +
							 "FROM Weights " +
							 "WHERE netID=%s AND subject=%s AND courseNum=%s AND courseName=%s AND category=%s",
							 [session['netid'], subject, courseNum, cName, category])
		if result > 0:  # duplicates exist
			error = '"' + category + '" is already a category.'
			mysql.connection.commit()
			cur.close()
			return render_template('addCategoryNoWeight.html', error=error, form=form)
		cur.execute('INSERT INTO Weights(netID, subject, courseNum, courseName, category, weight, drops) ' +
					'VALUES(%s, %s, %s, %s, %s, %s, %s)',
					[session['netid'], subject, courseNum, cName, category, weight, drops])
		# insertion goes through
		mysql.connection.commit()
		cur.close()
		flash('New category "' + category + '" has been added.', 'success')
		return redirect(url_for('mySchoolClass', name=name, cName=cName))
	return render_template('addCategoryNoWeight.html', form=form)

class addCategoryWeightedForm(Form):
	categoryName = StringField('Category Name', [validators.DataRequired()])
	categoryWeight = StringField('Weight (XX.XX)', [validators.Regexp(r'[0-9][0-9].[0-9][0-9]', message='Not formatted properly.')])
	drops = StringField('Number of Drops', [validators.Regexp(r'[0-9]+', message='Not a number.')])

# User tries to add category (weighted)
@app.route('/myclasses/<string:name>/<string:cName>/addCategory/Weight', methods=['GET','POST'])
@is_not_blocked
@is_logged_in
def addCategoryWeight(name, cName):
	form = addCategoryWeightedForm(request.form)
	if request.method == 'POST' and form.validate():  # form is correctly inputted
		subject = name[:name.index('-')]
		courseNum = name[name.index('-') + 1:]
		category = form.categoryName.data
		weight = form.categoryWeight.data
		drops = int(form.drops.data)
		# connect to DB
		cur = mysql.connection.cursor()
		result = cur.execute("SELECT * " +
							 "FROM Weights " +
							 "WHERE netID=%s AND subject=%s AND courseNum=%s AND courseName=%s AND category=%s",
							 [session['netid'], subject, courseNum, cName, category])
		if result > 0:  # duplicates exist
			error = '"' + category + '" is already a category.'
			mysql.connection.commit()
			cur.close()
			return render_template('addCategoryWeight.html', error=error, form=form)
		cur.execute('INSERT INTO Weights(netID, subject, courseNum, courseName, category, weight, drops) ' +
					'VALUES(%s, %s, %s, %s, %s, %s, %s)',
					[session['netid'], subject, courseNum, cName, category, weight, drops])
		# insertion goes through
		mysql.connection.commit()
		cur.close()
		flash('New category "' + category + '" has been added.', 'success')
		return redirect(url_for('mySchoolClass', name=name, cName=cName))
	return render_template('addCategoryWeight.html', form=form)

# user tries to delete category
@app.route('/myclasses/<string:name>/<string:cName>/deleteCategory/<string:category>', methods=['GET', 'POST'])
@is_not_blocked
@is_logged_in
def deleteCategory(name, cName,category):
	subject = name[:name.index('-')]
	courseNum = name[name.index('-') + 1:]
	if request.method == 'POST':
		# connect to DB
		cur = mysql.connection.cursor()
		cur.execute('DELETE FROM Weights ' +
					'WHERE netID=%s AND subject=%s AND courseNum=%s AND courseName=%s AND category=%s',
					[session['netid'], subject, courseNum, cName, category])
		# delete goes through
		mysql.connection.commit()
		cur.close()
		flash('"' + category + '"' + ' category has been removed.', 'success')
		return redirect(url_for('mySchoolClass', name=name, cName=cName))
	return render_template('maybeDeleteCategory.html', category=category)

class editWeightForm(Form):
	categoryWeight = StringField('Weight (XX.XX)',
								 [validators.Regexp(r'[0-9][0-9].[0-9][0-9]', message='Not formatted properly.')])

# User tries to edit weight
@app.route('/myclasses/<string:subject>-<string:courseNum>/<string:courseName>/EditWeight/<string:category>', methods=['GET','POST'])
@is_not_blocked
@is_logged_in
def editWeight(subject, courseNum, courseName, category):
	form = editWeightForm(request.form)
	if request.method == 'POST' and form.validate():  # form is correctly inputted
		weight = form.categoryWeight.data
		# connect to DB
		cur = mysql.connection.cursor()
		cur.execute('UPDATE Weights ' +
					'SET weight=%s ' +
					'WHERE netid=%s AND subject=%s AND courseNum=%s AND courseName=%s AND category=%s',
					[weight,
					 session['netid'], subject, courseNum, courseName, category])
		# insertion goes through
		mysql.connection.commit()
		cur.close()
		flash('Weight for "' + category + '" has been modified.', 'success')
		return redirect(url_for('mySchoolClass', name=subject+'-'+courseNum, cName=courseName))
	return render_template('editWeight.html', form=form)

class editDropForm(Form):
	drops = StringField('Number of Drops', [validators.Regexp(r'[0-9]+', message='Not a number.')])

# User tries to edit drops
@app.route('/myclasses/<string:subject>-<string:courseNum>/<string:courseName>/editDrops/<string:category>', methods=['GET','POST'])
@is_not_blocked
@is_logged_in
def editDrop(subject, courseNum, courseName, category):
	form = editDropForm(request.form)
	if request.method == 'POST' and form.validate():  # form is correctly inputted
		drops = form.drops.data
		# connect to DB
		cur = mysql.connection.cursor()
		cur.execute('UPDATE Weights ' +
					'SET drops=%s ' +
					'WHERE netid=%s AND subject=%s AND courseNum=%s AND courseName=%s AND category=%s',
					[drops,
					 session['netid'], subject, courseNum, courseName, category])
		# insertion goes through
		mysql.connection.commit()
		cur.close()
		flash('Drops for "' + category + '" has been modified.', 'success')
		return redirect(url_for('mySchoolClass', name=subject+'-'+courseNum, cName=courseName))
	return render_template('editDrops.html', form=form, category=category)

# user tries to see computed grade
@app.route('/myclasses/<string:name>/<string:cName>/calculateGrade')
@is_not_blocked
@is_logged_in
def calculateGrade(name, cName):
	subject = name[:name.index('-')]
	courseNum = name[name.index('-') + 1:]
	cur = mysql.connection.cursor()
	cur.execute("SELECT weighted " +
				"FROM Classes " +
				"WHERE netID=%s AND subject=%s AND courseNum=%s AND courseName=%s",
				[session['netid'], subject, courseNum, cName])
	weighted = cur.fetchall()[0]['weighted']
	cur.execute("SELECT category, weight, drops " +
				"FROM Weights " +
				"WHERE netID=%s AND subject=%s AND courseNum=%s AND courseName=%s",
				[session['netid'], subject, courseNum, cName])
	categories = cur.fetchall()
	categoryData = []
	totalScoredVec = []
	totalPossibleVec = []
	sum_ = 0
	sumOfWeights = 0
	for category in categories:
		cur.execute("SELECT attributeName, score, total " +
					"FROM Attributes " +
					"WHERE netID=%s AND subject=%s AND courseNum=%s AND courseName=%s AND category=%s",
					[session['netid'], subject, courseNum, cName, category['category']])
		attributes = cur.fetchall()
		if attributes:
			v = []
			for attribute in attributes:
				v.append([attribute['score'], attribute['total']])
			v = np.array(v)
			totalScored, totalPossible = drop(v, category['drops'])
			categoryData.append({
				'categoryName': category['category'],
				'attributes': attributes,
				'totalScored': totalScored,
				'totalPossible': totalPossible,
				'weight': category['weight']
			})
		else:
			categoryData.append({
				'categoryName': category['category'],
				'attributes': attributes,
				'totalScored': 0,
				'totalPossible': 0,
				'weight': category['weight']
			})
		if weighted:
			sumOfWeights += category['weight']
			if not attributes or totalPossible == 0:
				continue
			sum_ += (1.0*totalScored/totalPossible)*category['weight']
		else:
			totalScoredVec.append(totalScored)
			totalPossibleVec.append(totalPossible)
	mysql.connection.commit()
	cur.close()
	grade = 0
	if weighted:
		grade = sum_
	elif sum(totalPossibleVec):
		grade = 100.0*sum(totalScoredVec)/sum(totalPossibleVec)
	else:
		grade = 0
	if weighted and sumOfWeights != 100:
		flash('Weights do not add up to 100%.', 'danger')
		return redirect(url_for('mySchoolClass', name=name, cName=cName))
	return render_template('calculateGrade.html',
						   grade=grade,
						   weighted=weighted)

if __name__ == "__main__":
	app.run(debug=True)
