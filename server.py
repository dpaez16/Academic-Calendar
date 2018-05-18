from flask import Flask, render_template, flash, redirect, url_for, session, logging, request
from flask_mysqldb import MySQL
from wtforms import Form, StringField, TextAreaField, PasswordField, validators
from passlib.hash import sha256_crypt
from functools import wraps
from data import Classes

app = Flask(__name__)

classes = Classes()

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
                classes = []
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
            flash('Unauthorized, please login', 'danger')
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
@app.route('/myclasses/<string:name>')
@is_logged_in
def mySchoolClass(name):
    return render_template('class.html', name=name)

class addClassForm(Form):
    courseNum = StringField('Course Number', [validators.Regexp(r'[0-9][0-9][0-9]', message='Not a course number.')])
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
        netid = session['netid']
        # Connect to DB
        cur = mysql.connection.cursor()
        result = cur.execute("SELECT * FROM Classes WHERE courseNum=%s AND subject=%s AND netID=%s", [courseNum, subject, netid])
        if result > 0:
            error = "That class already exists for you."
            return render_template('addclass.html', error=error)
        else:
            # Add new class to DB
            cur.execute("INSERT INTO Classes(netID, subject, courseNum, courseName) VALUES(%s, %s, %s, %s)", [netid, subject, courseNum, courseName])
            # Commit changes to DB
            mysql.connection.commit()
            cur.close()
            flash('Class has been added.', 'success')
            return redirect(url_for('myclasses'))
    return render_template('addclass.html', form=form)

if __name__ == "__main__":
    app.secret_key='docpmoo10/10'
    app.run(debug=True)