from flask import Flask, render_template, flash, redirect, url_for, session, logging, request
from flask_mysqldb import MySQL
from wtforms import Form, StringField, TextAreaField, PasswordField, validators
from passlib.hash import sha256_crypt
from functools import wraps

app = Flask(__name__)

# Set up MySQL
app.config['MYSQL_HOST'] = '192.17.90.133'
app.config['MYSQL_USER'] = 'dpaez2_dpaez2'
app.config['MYSQL_PASSWORD'] = 'Cps41317779!!'
app.config['MYSQL_DB'] = 'dpaez2_Academic_Calendar'
app.config['MYSQL_CURSORCLASS'] = 'DictCursor'

# init MySQL
mysql = MySQL(app)

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
def register():
    form = RegisterForm(request.form)
    if request.method == 'POST' and form.validate(): # form is correctly inputted
        name = form.name.data
        netid = form.netid.data
        password = sha256_crypt.encrypt(str(form.password.data))
        # Connect to DB
        cur = mysql.connection.cursor()
        result = cur.execute("SELECT * FROM Users WHERE netid=%s", [netid])
        if result > 0:
            error = "User exists with that NetID."
            return render_template('register.html', form=form, error=error)
        else:
            # Add new user to DB
            cur.execute("INSERT INTO Users(netid, name, password) VALUES(%s, %s, %s)", (netid, name, password))
            # Commit changes to DB
            mysql.connection.commit()
            cur.close()
            flash('You are now registered and can log in.', 'success')
            return redirect(url_for('login'))
    return render_template('register.html', form=form)

# Login page
@app.route('/login', methods=['GET','POST'])
def login():
    if request.method == 'POST':
        netid = request.form['netid']
        password_candidate = request.form['password']
        # Connect to DB
        cur = mysql.connection.cursor()
        result = cur.execute("SELECT * FROM Users WHERE netid = %s", [netid])
        if result > 0:  # User is found
            data = cur.fetchone()
            password = data['password']
            if sha256_crypt.verify(password_candidate, password): # password works
                session['logged_in'] = True
                session['name'] = data['name']
                session['netid'] = netid
                flash('You are now logged in. Welcome, ' + session['name'] + '.', 'success')
                return redirect(url_for('myclasses'))
            else: # password does not work
                error = 'Invalid login.'
                return render_template('login.html', error=error)
            cur.close()
        else: # user not found
            error = 'NetID not found.'
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

# Logout button
@app.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out.', 'success')
    return redirect(url_for('login'))

# Class used for forgot password page
class NewPasswordForm(Form):
    newpassword = PasswordField('Password', [validators.DataRequired()])

# forgot password page
@app.route('/forgot', methods=['GET','POST'])
def forgot():
    form = NewPasswordForm(request.form)
    if request.method == 'POST' and form.validate(): # form inputted is correct
        newpassword = sha256_crypt.encrypt(str(form.newpassword.data))
        session['newpassword'] = newpassword
        return redirect(url_for('forgotDone'))
    return render_template('forgot.html', form=form)

# page after forgot password
@app.route('/forgotDone')
def forgotDone():
    return render_template('forgotDone.html')

@app.route('/updates')
def updates():
    return render_template('updates.html')

# User's classes page
@app.route('/myclasses')
@is_logged_in
def myclasses():
    classes = []
    # Connect to DB
    cur = mysql.connection.cursor()
    cur.execute("SELECT subject, courseNum, courseName FROM Classes WHERE netID=%s", [session['netid']])
    for row in cur.fetchall():
        classes.append({
            'subject': row['subject'],
            'courseNum': row['courseNum'],
            'courseName': row['courseName']
        })
    # Commit changes to DB
    mysql.connection.commit()
    cur.close()
    return render_template('myclasses.html', classes=classes)

# User clicks on class link
@app.route('/myclasses/<string:name>/<string:cName>')
@is_logged_in
def mySchoolClass(name,cName):
    subject = name[:name.index('-')]
    courseNum = name[name.index('-')+1:]
    cur = mysql.connection.cursor()
    cur.execute("SELECT weighted FROM Classes WHERE netID=%s AND subject=%s AND courseNum=%s AND courseName=%s", [session['netid'], subject, courseNum, cName])
    weighted = 0
    for row in cur.fetchall():
        weighted = row['weighted']
    if weighted:
        cur.execute("SELECT score, total, weight, attribute FROM Percentage WHERE netID=%s AND subject=%s AND courseNum=%s AND category=%s AND courseName=%s", [session['netid'], subject, courseNum, "Attendance", cName])
        dataAttendance = cur.fetchall()
        totalAttendanceScore, totalAttendancePossible = 0.0, 0.0
        weight = 0
        for row in dataAttendance:
            totalAttendanceScore += float(row['score'])
            totalAttendancePossible += float(row['total'])
            weight = float(row['weight'])
        return render_template('class.html',
                               subject=subject,
                               courseNum=courseNum,
                               courseName=cName,
                               weighted=weighted,
                               weight=weight,
                               dataAttendance=dataAttendance,
                               totalAttendanceScore=totalAttendanceScore,
                               totalAttendancePossible=totalAttendancePossible
                               )
    else:
        cur.execute("SELECT score, total, attribute FROM Points WHERE netID=%s AND subject=%s AND courseNum=%s AND category=%s AND courseName=%s", [session['netid'], subject, courseNum, "Attendance", cName])
        dataAttendance = cur.fetchall()
        totalAttendanceScore, totalAttendancePossible = 0.0, 0.0
        for row in dataAttendance:
            totalAttendanceScore += float(row['score'])
            totalAttendancePossible += float(row['total'])
        cur.execute("SELECT score, total, attribute FROM Points WHERE netID=%s AND subject=%s AND courseNum=%s AND category=%s AND courseName=%s", [session['netid'], subject, courseNum, "Homework", cName])
        dataHomework = cur.fetchall()
        totalHomeworkScore, totalHomeworkPossible = 0.0, 0.0
        for row in dataHomework:
            totalHomeworkScore += float(row['score'])
            totalHomeworkPossible += float(row['total'])
        cur.execute("SELECT score, total, attribute FROM Points WHERE netID=%s AND subject=%s AND courseNum=%s AND category=%s AND courseName=%s", [session['netid'], subject, courseNum, "Prelab", cName])
        dataPrelab = cur.fetchall()
        totalPrelabScore, totalPrelabPossible = 0.0, 0.0
        for row in dataPrelab:
            totalPrelabScore += float(row['score'])
            totalPrelabPossible += float(row['total'])
        cur.execute("SELECT score, total, attribute FROM Points WHERE netID=%s AND subject=%s AND courseNum=%s AND category=%s AND courseName=%s", [session['netid'], subject, courseNum, "Postlab", cName])
        dataPostlab = cur.fetchall()
        totalPostlabScore, totalPostlabPossible = 0.0, 0.0
        for row in dataPostlab:
            totalPostlabScore += float(row['score'])
            totalPostlabPossible += float(row['total'])
        cur.execute("SELECT score, total, attribute FROM Points WHERE netID=%s AND subject=%s AND courseNum=%s AND category=%s AND courseName=%s", [session['netid'], subject, courseNum, "LabReport", cName])
        dataLabReport = cur.fetchall()
        totalLabReportScore, totalLabReportPossible = 0.0, 0.0
        for row in dataLabReport:
            totalLabReportScore += float(row['score'])
            totalLabReportPossible += float(row['total'])
        cur.execute("SELECT score, total, attribute FROM Points WHERE netID=%s AND subject=%s AND courseNum=%s AND category=%s AND courseName=%s", [session['netid'], subject, courseNum, "GroupProject", cName])
        dataGroupProject = cur.fetchall()
        totalGroupProjectScore, totalGroupProjectPossible = 0.0, 0.0
        for row in dataGroupProject:
            totalGroupProjectScore += float(row['score'])
            totalGroupProjectPossible += float(row['total'])
        cur.execute("SELECT score, total, attribute FROM Points WHERE netID=%s AND subject=%s AND courseNum=%s AND category=%s AND courseName=%s", [session['netid'], subject, courseNum, "Project", cName])
        dataProject = cur.fetchall()
        totalProjectScore, totalProjectPossible = 0.0, 0.0
        for row in dataProject:
            totalProjectScore += float(row['score'])
            totalProjectPossible += float(row['total'])
        cur.execute("SELECT score, total, attribute FROM Points WHERE netID=%s AND subject=%s AND courseNum=%s AND category=%s AND courseName=%s", [session['netid'], subject, courseNum, "Exam", cName])
        dataExams = cur.fetchall()
        totalExamsScore, totalExamsPossible = 0.0, 0.0
        for row in dataExams:
            totalExamsScore += float(row['score'])
            totalExamsPossible += float(row['total'])
        cur.execute("SELECT score, total, attribute FROM Points WHERE netID=%s AND subject=%s AND courseNum=%s AND category=%s AND courseName=%s", [session['netid'], subject, courseNum, "Final", cName])
        dataFinal = cur.fetchall()
        totalFinalScore, totalFinalPossible = 0.0, 0.0
        for row in dataFinal:
            totalFinalScore += float(row['score'])
            totalFinalPossible += float(row['total'])
        return render_template('class.html',
                               subject=subject,
                               courseNum=courseNum,
                               courseName=cName,
                               weighted=weighted,
                               dataAttendance=dataAttendance,
                               totalAttendanceScore=totalAttendanceScore,
                               totalAttendancePossible=totalAttendancePossible,
                               dataHomework=dataHomework,
                               totalHomeworkScore=totalHomeworkScore,
                               totalHomeworkPossible=totalHomeworkPossible,
                               dataPrelab=dataPrelab,
                               totalPrelabScore=totalPrelabScore,
                               totalPrelabPossible=totalPrelabPossible,
                               dataPostlab=dataPostlab,
                               totalPostlabScore=totalPostlabScore,
                               totalPostlabPossible=totalPostlabPossible,
                               dataLabReport=dataLabReport,
                               totalLabReportScore=totalLabReportScore,
                               totalLabReportPossible=totalLabReportPossible,
                               dataGroupProject=dataGroupProject,
                               totalGroupProjectScore=totalGroupProjectScore,
                               totalGroupProjectPossible=totalGroupProjectPossible,
                               dataProject=dataProject,
                               totalProjectScore=totalProjectScore,
                               totalProjectPossible=totalProjectPossible,
                               dataExams=dataExams,
                               totalExamsScore=totalExamsScore,
                               totalExamsPossible=totalExamsPossible,
                               dataFinal=dataFinal,
                               totalFinalScore=totalFinalScore,
                               totalFinalPossible=totalFinalPossible
                               )

class addClassForm(Form):
    courseNum = StringField('Course Number', [validators.Regexp(r'[0-9][0-9][0-9]', message='Not a course number.'),validators.Length(min=3, max=3, message='Field must be 3 numbers long.')])
    courseName = StringField('Course Name', [validators.DataRequired()])

# User tries to add class
@app.route('/myclasses/addclass', methods=['GET','POST'])
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
        result = cur.execute("SELECT * FROM Classes WHERE courseNum=%s AND subject=%s AND netID=%s AND courseName=%s", [courseNum, subject, netid, courseName])
        if result > 0:
            error = subject + courseNum + ": " + courseName + " is already in your list of classes."
            return render_template('addclass.html', error=error, form=form)
        else:
            # Add new class to DB
            cur.execute("INSERT INTO Classes(netID, subject, courseNum, courseName, weighted) VALUES(%s, %s, %s, %s, %s)", [netid, subject, courseNum, courseName, weighted])
            # Commit changes to DB
            mysql.connection.commit()
            cur.close()
            flash(subject + courseNum + ": " + courseName + ' has been added to your list of classes.', 'success')
            return redirect(url_for('myclasses'))
    return render_template('addclass.html', form=form)

# User tries to delete a class
@app.route('/myclasses/delete/<string:course>/<string:cName>', methods=['GET', 'POST'])
@is_logged_in
def deleteClass(course, cName):
    subject = course[:course.index('-')]
    courseNum = course[course.index('-') + 1:]
    if request.method == 'POST':
        # connect to DB
        cur = mysql.connection.cursor()
        cur.execute('DELETE FROM Classes WHERE netID=%s AND subject=%s AND courseNum=%s AND courseName=%s', [session['netid'], subject, courseNum, cName])
        # delete goes through
        mysql.connection.commit()
        cur.close()
        flash(subject + courseNum + ": " + cName + ' has been removed.', 'success')
        return redirect(url_for('myclasses'))
    return render_template('maybeDelete.html', subject=subject, courseNum=courseNum, courseName=cName)

class addAttributeNoWeightForm(Form):
    score = StringField('Score', [validators.Regexp(r'[0-9]+(.|)[0-9]*', message='Not a number.')])
    total = StringField('Out Of', [validators.Regexp(r'[0-9]+(.|)[0-9]*', message='Not a number.')])
    attrTitle = StringField('Name of Attribute', [validators.DataRequired()])

# User tries to add attribute (no weight)
@app.route('/myclasses/<string:name>/<string:cName>/Add<string:attr>', methods=['GET','POST'])
@is_logged_in
def addAttributeNoWeight(name, cName, attr):
    form = addAttributeNoWeightForm(request.form)
    if request.method == 'POST' and form.validate():  # form is correctly inputted
        subject = name[:name.index('-')]
        courseNum = name[name.index('-') + 1:]
        score = form.score.data
        total = form.total.data
        if float(form.score.data) > float(form.total.data):
            flash('Score is greater than total.', 'danger')
            #return redirect(url_for('mySchoolClass', name=name, cName=cName))
            return render_template('addAttributeNoWeight.html', form=form, attribute=attr)
        attrTitle = form.attrTitle.data
        # Connect to DB
        cur = mysql.connection.cursor()
        # Add new attribute to DB
        cur.execute("INSERT INTO Points(netID, subject, courseNum, courseName, category, attribute, score, total) VALUES(%s, %s, %s, %s, %s, %s, %s, %s)", [session['netid'], subject, courseNum, cName, attr, attrTitle ,score, total])
        # Commit changes to DB
        mysql.connection.commit()
        cur.close()
        flash(attr + ' attribute has been added.', 'success')
        return redirect(url_for('mySchoolClass', name=name, cName=cName))
    return render_template('addAttributeNoWeight.html', form=form, attribute=attr)

class editAttributeNoWeightForm(Form):
    score = StringField('Score', [validators.Regexp(r'[0-9]+(.|)[0-9]*', message='Not a number.')])
    total = StringField('Out Of', [validators.Regexp(r'[0-9]+(.|)[0-9]*', message='Not a number.')])
    attrTitle = StringField('Name of Attribute', [validators.DataRequired()])

# User tries to edit attribute (no weight)
@app.route('/myclasses/<string:name>/<string:cName>/Edit<string:attr>/<string:oldAttrTitle>/<string:oldScore>-<string:oldTotal>', methods=['GET','POST'])
@is_logged_in
def editAttributeNoWeight(name, cName, attr, oldAttrTitle, oldScore, oldTotal):
    form = editAttributeNoWeightForm(request.form)
    if request.method == 'POST' and form.validate():  # form is correctly inputted
        subject = name[:name.index('-')]
        courseNum = name[name.index('-') + 1:]
        score = form.score.data
        total = form.total.data
        if float(form.score.data) > float(form.total.data):
            flash('Score is greater than total.', 'danger')
            #return redirect(url_for('mySchoolClass', name=name, cName=cName))
            return render_template('editAttributeNoWeight.html', form=form, attribute=attr)
        attrTitle = form.attrTitle.data
        # Connect to DB
        cur = mysql.connection.cursor()
        # Add new attribute to DB
        cur.execute("UPDATE Points SET attribute=%s, score=%s, total=%s WHERE netID=%s AND subject=%s AND courseNum=%s AND courseName=%s AND category=%s AND attribute=%s AND score=%s AND total=%s", [attrTitle, score, total, session['netid'], subject, courseNum, cName, attr, oldAttrTitle ,oldScore, oldTotal])
        # Commit changes to DB
        mysql.connection.commit()
        cur.close()
        flash(attr + ' attribute has been modified.', 'success')
        return redirect(url_for('mySchoolClass', name=name, cName=cName))
    return render_template('editAttributeNoWeight.html', form=form, attribute=attr)

class addAttributeWeightForm(Form):
    score = StringField('Score', [validators.Regexp(r'[0-9]+(.|)[0-9]*', message='Not a number.')])
    total = StringField('Out Of', [validators.Regexp(r'[0-9]+(.|)[0-9]*', message='Not a number.')])
    attrTitle = StringField('Name of Attribute', [validators.DataRequired()])
    weight = StringField('Weight (XX.XX, should be the same as others in the category.)', [validators.Regexp(r'[0-9][0-9].[0-9][0-9]', message='Not a number.')])

# User tries to add attribute (weight)
@app.route('/myclasses/<string:name>/<string:cName>/Add<string:attr>Weight', methods=['GET','POST'])
@is_logged_in
def addAttributeWeight(name, cName, attr):
    form = addAttributeWeightForm(request.form)
    if request.method == 'POST' and form.validate():  # form is correctly inputted
        subject = name[:name.index('-')]
        courseNum = name[name.index('-') + 1:]
        score = form.score.data
        total = form.total.data
        weight = form.weight.data
        if float(form.score.data) > float(form.total.data):
            flash('Score is greater than total.', 'danger')
            return render_template('addAttributeWeight.html', form=form, attribute=attr)
        attrTitle = form.attrTitle.data
        # Connect to DB
        cur = mysql.connection.cursor()
        result = cur.execute('SELECT * FROM Percentage WHERE netID=%s AND subject=%s AND courseNum=%s AND courseName=%s AND category=%s', [session['netid'], subject, courseNum, cName, attr])
        if result != 0:
            result = cur.execute('SELECT * FROM Percentage WHERE netID=%s AND subject=%s AND courseNum=%s AND courseName=%s AND category=%s AND weight=%s', [session['netid'], subject, courseNum, cName, attr, weight])
            if result == 0:
                flash('Weight is not the same as the others.', 'danger')
                return render_template('addAttributeWeight.html', form=form, attribute=attr)
        # Add new attribute to DB (nothing has been added to category yet OR weight is the same as the others)
        cur.execute("INSERT INTO Percentage(netID, subject, courseNum, courseName, category, attribute, score, total, weight) VALUES(%s, %s, %s, %s, %s, %s, %s, %s, %s)", [session['netid'], subject, courseNum, cName, attr, attrTitle ,score, total, weight])
        # Commit changes to DB
        mysql.connection.commit()
        cur.close()
        flash(attr + ' attribute has been added.', 'success')
        return redirect(url_for('mySchoolClass', name=name, cName=cName))
    return render_template('addAttributeWeight.html', form=form, attribute=attr)

@app.route('/myclasses/<string:name>/<string:cName>/Delete<string:attr>/<string:attrTitle>/<string:score>-<string:total>', methods=['GET','POST'])
@is_logged_in
def deleteAttributeNoWeight(name, cName, attr, attrTitle, score, total):
    subject = name[:name.index('-')]
    courseNum = name[name.index('-') + 1:]
    if request.method == 'POST':
        # connect to DB
        cur = mysql.connection.cursor()
        cur.execute('DELETE FROM Points WHERE netID=%s AND subject=%s AND courseNum=%s AND courseName=%s AND category=%s AND attribute=%s AND score=%s AND total=%s', [session['netid'], subject, courseNum, cName, attr, attrTitle, score, total])
        # delete goes through
        mysql.connection.commit()
        cur.close()
        flash(attr + ' attribute has been removed.', 'success')
        return redirect(url_for('mySchoolClass', name=name, cName=cName))
    return render_template('maybeDeleteAttribute.html', attrTitle=attrTitle, attribute=attr)

@app.route('/myclasses/<string:name>/<string:cName>/Delete<string:attr>Weight/<string:attrTitle>/<string:score>-<string:total>/<string:weight>', methods=['GET','POST'])
@is_logged_in
def deleteAttributeWeight(name, cName, attr, attrTitle, score, total, weight):
    subject = name[:name.index('-')]
    courseNum = name[name.index('-') + 1:]
    if request.method == 'POST':
        # connect to DB
        cur = mysql.connection.cursor()
        cur.execute('DELETE FROM Percentage WHERE netID=%s AND subject=%s AND courseNum=%s AND courseName=%s AND category=%s AND attribute=%s AND score=%s AND total=%s AND weight=%s', [session['netid'], subject, courseNum, cName, attr, attrTitle, score, total, weight])
        # delete goes through
        mysql.connection.commit()
        cur.close()
        flash(attr + ' attribute has been removed.', 'success')
        return redirect(url_for('mySchoolClass', name=name, cName=cName))
    return render_template('maybeDeleteAttribute.html', attrTitle=attrTitle, attribute=attr)

if __name__ == "__main__":
    app.secret_key='docpmoo10/10'
    app.run(debug=True)