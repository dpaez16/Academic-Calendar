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

@app.route('/')
def Index():
    return render_template('home.html')

@app.route('/about')
def About():
    return render_template('about.html')

class RegisterForm(Form):
    name = StringField('Initials/Name (If pledge)', [validators.Length(min=1, max=50)])
    netid = StringField('NetID', [validators.Regexp(r'[a-z]+[0-9]+', message='Not NetID.')])
    password = PasswordField('Password', [
        validators.DataRequired(),
        validators.EqualTo('confirm', message='Passwords do not match.')
    ])
    confirm = PasswordField('Confirm Password')

@app.route('/register', methods=['GET', 'POST'])
def register():
    form = RegisterForm(request.form)
    if request.method == 'POST' and form.validate():
        name = form.name.data
        netid = form.netid.data
        password = sha256_crypt.encrypt(str(form.password.data))
        cur = mysql.connection.cursor()
        cur.execute("INSERT INTO Users(netid, name, password) VALUES(%s, %s, %s)", (netid, name, password))
        mysql.connection.commit()
        cur.close()
        flash('You are now registered and can log in.', 'success')
        return redirect(url_for('login'))
    return render_template('register.html', form=form)

@app.route('/login', methods=['GET','POST'])
def login():
    if request.method == 'POST':
        netid = request.form['netid']
        password_candidate = request.form['password']
        cur = mysql.connection.cursor()
        result = cur.execute("SELECT * FROM Users WHERE netid = %s", [netid])
        if result > 0:
            data = cur.fetchone()
            password = data['password']
            if sha256_crypt.verify(password_candidate, password):
                # password works
                session['logged_in'] = True
                session['name'] = data['name']
                flash('You are now logged in.', 'success')
                return redirect(url_for('dashboard'))
            else:
                error = 'Invalid login.'
                return render_template('login.html', error=error)
            cur.close()
        else:
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

@app.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out.', 'success')
    return redirect(url_for('login'))

class NewPasswordForm(Form):
    newpassword = PasswordField('Password', [validators.DataRequired()])

@app.route('/forgot', methods=['GET','POST'])
def forgot():
    form = NewPasswordForm(request.form)
    if request.method == 'POST' and form.validate():
        newpassword = sha256_crypt.encrypt(str(form.newpassword.data))
        session['newpassword'] = newpassword
        return redirect(url_for('forgotDone'))
    return render_template('forgot.html', form=form)

@app.route('/forgotDone')
def forgotDone():
    return render_template('forgotDone.html')

@app.route('/dashboard')
@is_logged_in
def dashboard():
    return render_template('dashboard.html')

if __name__ == "__main__":
    app.secret_key='docpmoo10/10'
    app.run(debug=True)