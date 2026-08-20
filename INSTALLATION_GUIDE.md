# Shield Job Portal — cPanel Installation & Deployment Guide

This guide walks you through deploying **Shield Job Portal** on any standard **cPanel Shared Hosting** or dedicated Linux web server running **Apache + PHP (7.4 to 8.3+) + MySQL / MariaDB**.

> [!NOTE]
> **No Node.js or terminal root access required.** The application runs on standard PHP & MySQL with zero external daemon dependencies.

---

## 1. Quick Overview of Project Structure

```
public_html/ (or your domain root)
├── index.html              # Main application entry point & dashboard shell
├── install.php             # 1-Click web installation wizard
├── schema.sql              # MySQL database schema & seed tables
├── .htaccess               # Apache configuration, compression & security rules
├── assets/
│   ├── css/
│   │   └── style.css       # Luxury 3D dark-gold-red styling & animations
│   └── js/
│       ├── api.js          # REST API client & dual-mode connector
│       └── app.js          # Frontend controllers, audio, CRM & ATS logic
├── api/                    # Native PHP REST API backend
│   ├── config.php          # Database configuration (written by install.php)
│   ├── db.php              # PDO database handler & authentication
│   ├── auth.php            # Registration, login & profile management
│   ├── jobs.php            # Job postings & public search
│   ├── applications.php    # Applications & 6-stage ATS pipeline
│   ├── freelancers.php     # Freelancer services & hire requests
│   ├── trainers.php        # Trainer courses & enrollment requests
│   ├── manpower.php        # Workforce pool, available lists & deployments
│   ├── contractors.php     # Active projects & vendor bidding
│   ├── crm.php             # CRM dashboard, circular gauges & leads
│   ├── settings.php        # Live site customization & platform pricing
│   ├── users.php           # Admin database viewer & subscription management
│   └── upload.php          # Secure CV resume & media upload handler
└── uploads/                # File storage directory (auto-created)
    ├── resumes/            # Candidate uploaded CV files
    └── images/             # Uploaded logos & hero banners
```

---

## 2. Step-by-Step Deployment Instructions

### Step 1: Create a MySQL Database in cPanel
1. Log into your **cPanel** account.
2. Under the **Databases** section, click **MySQL® Database Wizard**.
3. **Step 1 — Create a Database**:
   - Enter a database name (e.g. `shield_portal`).
   - Click **Next Step**.
4. **Step 2 — Create Database Users**:
   - Enter a database username (e.g. `shield_user`).
   - Generate or enter a strong password.
   - Click **Create User**.
5. **Step 3 — Add User to the Database**:
   - Check **ALL PRIVILEGES**.
   - Click **Make Changes**.
6. Note down the **Database Name**, **Database Username**, and **Database Password**.

---

### Step 2: Upload Files to cPanel
1. In cPanel, navigate to **Files** → **File Manager**.
2. Go to your web root folder (usually `public_html` or `public_html/your_subdomain`).
3. Upload all files from this project (you can zip the project folder, upload the zip, and click **Extract**).
4. Ensure the `uploads/` folder and `api/` folder have **write permissions** (`0755` or `0775`).

---

### Step 3: Run the 1-Click Web Installer
1. Open your web browser and visit:
   ```
   https://yourdomain.com/install.php
   ```
2. The **Diagnostics** screen will check your PHP version and extensions (`PDO`, `pdo_mysql`, `fileinfo`). Click **Proceed**.
3. Enter your database credentials created in Step 1:
   - **Database Host**: `localhost` (standard on 99% of cPanel hosts)
   - **Database Port**: `3306`
   - **Database Name**: (e.g., `cpaneluser_shield_portal`)
   - **Database User**: (e.g., `cpaneluser_shield_user`)
   - **Database Password**: (your database password)
4. Confirm your default **Administrator Account**:
   - **Email**: `shreekant@shieldinfrasolutions.in`
   - **Password**: `Shree#2425@22267`
5. Click **Run 1-Click Installation & Setup Database**.
6. The installer will automatically import `schema.sql`, configure the administrator account, create the upload directories, and write `api/config.php`.
7. Click **Launch Shield Job Portal** to start using the live site!

---

## 3. Testing Locally Before Deploying

You can test the entire web application right now on your local computer before deploying:

1. **Direct Browser Preview**:
   - Simply double-click `index.html` to open it in Google Chrome, Edge, Firefox, or Safari.
   - The dual-mode client will automatically initialize all preloaded demo data for Job Seekers, Employers, Freelancers, Trainers, Manpower Providers, and Contractors.
2. **Local HTTP Server**:
   - Run `npx serve .` or `npm start` in this directory to serve it locally.

---

## 4. Default Login Credentials

| Role | Email | Default Password |
|---|---|---|
| **Administrator** | `shreekant@shieldinfrasolutions.in` | `Shree#2425@22267` |
| **Job Seeker (Demo)** | `aarav@example.com` | `Shree#2425@22267` |
| **Employer (Demo)** | `hr@apextech.com` | `Shree#2425@22267` |
| **Freelancer (Demo)** | `rohan@designcraft.com` | `Shree#2425@22267` |
| **Trainer (Demo)** | `meera@trainpro.in` | `Shree#2425@22267` |
| **Manpower (Demo)** | `manpower@shieldinfra.in` | `Shree#2425@22267` |
| **Contractor (Demo)** | `projects@buildmaster.in` | `Shree#2425@22267` |

---

## 5. Security & Maintenance Checklist

- [x] Once installation is complete, you may optionally delete or rename `install.php` for extra security.
- [x] Passwords are encrypted with standard **BCRYPT** password hashing.
- [x] Uploaded resumes are validated for file extension and size (max 5MB) and saved with safe randomized identifiers.
- [x] All database operations use **PDO prepared statements** to prevent SQL injection vulnerabilities.
- [x] `.htaccess` prevents direct listing or downloading of `.sql` files or source manifests.
