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
        result = cur.execute("SELECT * " +
                             "FROM Users " +
                             "WHERE netID=%s", [netid])
        if result > 0:
            error = "User exists with that NetID."
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
            if sha256_crypt.verify(password_candidate, password): # password works
                session['logged_in'] = True
                session['name'] = data['name']
                session['netid'] = netid
                flash('You are now logged in. Welcome, ' + session['name'] + '.', 'success')
                mysql.connection.commit()
                cur.close()
                return redirect(url_for('myclasses'))
            else: # password does not work
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

# my profile page
@app.route('/myprofile')
@is_logged_in
def myProfile():
    return render_template('profile.html', name=session['name'], netid=session['netid'])

# User's classes page
@app.route('/myclasses')
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
    cur.execute("SELECT category, weight " +
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
        totalScored, totalPossible = 0.0, 0.0
        for attribute in attributes:
            totalScored += attribute['score']
            totalPossible += attribute['total']
            atLeastOneAttribute = True
        categoryData.append({
            'categoryName': category['category'],
            'attributes': attributes,
            'totalScored': totalScored,
            'totalPossible': totalPossible,
            'weight': category['weight']
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
        validators.Regexp(r'[0-9][0-9][0-9]', message='Not a course number.'),
        validators.Length(min=3, max=3, message='Field must be 3 numbers long.')])
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
        validators.Regexp(r'[0-9][0-9][0-9]', message='Not a course number.'),
        validators.Length(min=3, max=3, message='Field must be 3 numbers long.')])
    courseName = StringField('Course Name', [validators.DataRequired()])

# User tries to edit a class
@app.route('/myclasses/edit/<string:oldCourse>/<string:oldCourseName>/<string:oldWeighted>', methods=['GET', 'POST'])
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
@is_logged_in
def addAttribute(name, cName, category):
    form = addAttributeForm(request.form)
    if request.method == 'POST' and form.validate():  # form is correctly inputted
        subject = name[:name.index('-')]
        courseNum = name[name.index('-') + 1:]
        score = form.score.data
        total = form.total.data
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
        cur.execute("INSERT INTO Attributes(netID, subject, courseNum, courseName, category, attributeName, score, total) " +
                    "VALUES(%s, %s, %s, %s, %s, %s, %s, %s)",
                    [session['netid'], subject, courseNum, cName, category, attributeName ,score, total])
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

# User tries to add category (no weight)
@app.route('/myclasses/<string:name>/<string:cName>/addCategory/NoWeight', methods=['GET','POST'])
@is_logged_in
def addCategoryNoWeight(name, cName):
    form = addCategoryNoWeightForm(request.form)
    if request.method == 'POST' and form.validate():  # form is correctly inputted
        subject = name[:name.index('-')]
        courseNum = name[name.index('-') + 1:]
        category = form.categoryName.data
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
        cur.execute('INSERT INTO Weights(netID, subject, courseNum, courseName, category, weight) ' +
                    'VALUES(%s, %s, %s, %s, %s, %s)',
                    [session['netid'], subject, courseNum, cName, category, weight])
        # insertion goes through
        mysql.connection.commit()
        cur.close()
        flash('New category "' + category + '" has been added.', 'success')
        return redirect(url_for('mySchoolClass', name=name, cName=cName))
    return render_template('addCategoryNoWeight.html', form=form)

class addCategoryWeightedForm(Form):
    categoryName = StringField('Category Name', [validators.DataRequired()])
    categoryWeight = StringField('Weight (XX.XX)', [validators.Regexp(r'[0-9][0-9].[0-9][0-9]', message='Not formatted properly.')])

# User tries to add category (weighted)
@app.route('/myclasses/<string:name>/<string:cName>/addCategory/Weight', methods=['GET','POST'])
@is_logged_in
def addCategoryWeight(name, cName):
    form = addCategoryWeightedForm(request.form)
    if request.method == 'POST' and form.validate():  # form is correctly inputted
        subject = name[:name.index('-')]
        courseNum = name[name.index('-') + 1:]
        category = form.categoryName.data
        weight = form.categoryWeight.data
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
        cur.execute('INSERT INTO Weights(netID, subject, courseNum, courseName, category, weight) ' +
                    'VALUES(%s, %s, %s, %s, %s, %s)',
                    [session['netid'], subject, courseNum, cName, category, weight])
        # insertion goes through
        mysql.connection.commit()
        cur.close()
        flash('New category "' + category + '" has been added.', 'success')
        return redirect(url_for('mySchoolClass', name=name, cName=cName))
    return render_template('addCategoryWeight.html', form=form)

# user tries to delete category
@app.route('/myclasses/<string:name>/<string:cName>/deleteCategory/<string:category>', methods=['GET', 'POST'])
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

# user tries to see computed grade
@app.route('/myclasses/<string:name>/<string:cName>/calculateGrade')
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
    cur.execute("SELECT category, weight " +
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
        totalScored, totalPossible = 0.0, 0.0
        for attribute in attributes:
            totalScored += attribute['score']
            totalPossible += attribute['total']
        categoryData.append({
            'categoryName': category['category'],
            'attributes': attributes,
            'totalScored': totalScored,
            'totalPossible': totalPossible,
            'weight': category['weight']
        })
        if weighted:
            sumOfWeights += category['weight']
            if not attributes:
                continue
            sum_ += (1.0*totalScored/totalPossible)*category['weight']
        else:
            totalScoredVec.append(totalScored)
            totalPossibleVec.append(totalPossible)
    mysql.connection.commit()
    cur.close()
    grade = sum_ if weighted else 100.0*sum(totalScoredVec)/sum(totalPossibleVec)
    if weighted and sumOfWeights != 100:
        flash('Weights do not add up to 100%.', 'danger')
        return redirect(url_for('mySchoolClass', name=name, cName=cName))
    return render_template('calculateGrade.html',
                           grade=grade,
                           weighted=weighted)

if __name__ == "__main__":
    app.secret_key='docpmoo10/10'
    app.run(debug=True)