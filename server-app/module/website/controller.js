const dateTime = require('node-datetime')
const mongoose = require('mongoose')
const crypto = require('crypto')

const DASHBOARD_ADMIN_CONFIG = require('../../config/dashboard-admin-config')
const SITE_CONFIG = require('../../config/site-config')
const VIEW_FUNCTIONS = require('../../lib/view-functions')
const VIEWS = require('../../config/views')
const APP_CONFIG = require('../../config/config')
const session = require('../../lib/session')
const mail = require('../../lib/mail')

const userQuery = require('../user/query')
const postQuery = require('../post/query')
const pageQuery = require('../page/query')
const settingQuery = require('../setting/query')
const siteQuery = require('../site/query')
const viewQuery = require('../view/query')
const resourceQuery = require('../resource/query')
const roleQuery = require('../role/query')


exports.websiteSetupView = async (req, res) => {
  let totalUsers = await userQuery.getTotalItems()
  if (totalUsers.error) {
    res.view('setup', {
      viewFunctions: VIEW_FUNCTIONS,
      title: 'SETUP',
      error_message: 'Error',
      csrfToken: req.csrfToken(),
    })
    return
  }
  if (totalUsers) {
    DASHBOARD_ADMIN_CONFIG.setupPassed = true
    return res.redirect('/admin')
  }
  DASHBOARD_ADMIN_CONFIG.setupPassed = false
  res.view('setup', {
    viewFunctions: VIEW_FUNCTIONS,
    title: 'SETUP',
    error_message: '',
    csrfToken: req.csrfToken(),
  })
}

exports.websiteSetupPassed = async (req, res, next) => {
  if (!DASHBOARD_ADMIN_CONFIG.setupPassed)
    return res.redirect('/setup')
}

exports.websiteSetupSetInitialConfig = async (req, res) => {
  if (req.validationError) {
    let fisrtMessage = req.validationError.validation[0]
    res.view('setup', {
      title: 'SETUP',
      error_message: fisrtMessage.message,
      csrfToken: req.csrfToken(),
    })
    return
  }
  let adminRootRef = '000000000000000000000000'
  let setup_site_name = req.body.setup_site_name
  let setup_site_url = req.body.setup_site_url
  let setup_first_name = req.body.setup_first_name
  let setup_user_email = req.body.setup_user_email
  let setup_user_name = req.body.setup_user_name
  let setup_user_pass = req.body.setup_user_pass
  if (!setup_site_name && !setup_site_url && !setup_first_name && !setup_user_name && !setup_user_pass) {
    res.view('setup', {
      title: 'SETUP',
      error_message: 'Complete the request data',
      csrfToken: req.csrfToken(),
    })
  } else {
    let userData = {}
    let settingsData = {}
    let siteData = {}
    let totalUsers = await userQuery.getTotalItems()
    if (totalUsers)
      return res.redirect('admin')

    let viewsSaved = await viewQuery.createMany(VIEWS)
    let adminRoleData = {}
    adminRoleData.role_name = 'administrator'
    adminRoleData.role_user_ref = adminRootRef
    let adminRole = await roleQuery.create(adminRoleData)
    let resources = []
    for (let view of viewsSaved) {
      resources.push({
        resource_name: view.view_name,
        resource_permission: ['c', 'r', 'u', 'd', 'v'],
        resource_role_ref: adminRole._id,
      })
    }
    await resourceQuery.createMany(resources)
    let userPassword = await session.hashPassword(setup_user_pass)
    userData.user_name = setup_user_name
    userData.user_pass = userPassword
    userData.user_email = setup_user_email
    userData.user_first_name = setup_first_name
    userData.user_registration_date = dateTime.create().format('Y-m-d H:M:S')
    userData.user_active = true
    userData.user_role_ref = adminRole
    userData.user_user_ref = adminRootRef
    settingsData.setting_page_title = DASHBOARD_ADMIN_CONFIG.dashboardTitle
    settingsData.setting_items_peer_page = DASHBOARD_ADMIN_CONFIG.MAX_PAGES_BY_REQUEST
    siteData.site_name = setup_site_name
    siteData.site_items_peer_page = SITE_CONFIG.siteItemsPeerPage
    siteData.site_url = setup_site_url
    siteData.site_theme = SITE_CONFIG.siteTheme
    await userQuery.create(userData)
    await settingQuery.create(settingsData)
    await siteQuery.create(siteData)
    if (userQuery.error || settingQuery.error || siteQuery.error) {
      // NOTE: drop collections
      res.view('setup', {
        title: 'SETUP',
        error_message: userQuery.error.toString(),
        csrfToken: req.csrfToken(),
      })
      return
    }
    let emailHTMLMessage = `<h1>Hi ${ userData.user_first_name }!</h1><br />`
    emailHTMLMessage += 'Your new site is ready!<br />'
    emailHTMLMessage += `You can access to Dashboard in: ${ siteData.site_url }/admin<br />`
    emailHTMLMessage += '<br />Thank you for use Reactive CMS :)<br />'
    let emailSubject = `${ DASHBOARD_ADMIN_CONFIG.dashboardTitle } - ${ siteData.site_name }`
    DASHBOARD_ADMIN_CONFIG.setupPasse = true
    mail.sendEmail({
      to: userData.user_email,
      subject: emailSubject,
      html: emailHTMLMessage,
    })
    res.redirect('admin')
  }
}

exports.websiteAdminValidateRequestAccess = async (req, res) => {
  let totalUsers = await userQuery.getTotalItems()
  if (!totalUsers)
    return res.redirect('setup')

  if (req.session.user && req.session.user.user_role)
    res.redirect('dashboard')
  else {
    res.view('dashboard-login', {
      title: DASHBOARD_ADMIN_CONFIG.dashboardTitle,
      error_message: '',
      csrfToken: req.csrfToken(),
    })
  }
}

exports.websiteAdminValidateLoginAccess = async (req, res) => {
  if (req.validationError) {
    let fisrtMessage = req.validationError.validation[0]
    res.view('dashboard-login', {
      title: DASHBOARD_ADMIN_CONFIG.dashboardTitle,
      error_message: fisrtMessage.message,
      csrfToken: req.csrfToken(),
    })
    return
  }
  let totalUsers = await userQuery.getTotalItems()
  if (!totalUsers)
    return res.redirect('setup')

  const user_name = req.body.user_name
  const user_pass = req.body.user_pass
  let roles = await roleQuery.getAll()
  let user = await userQuery.getByUserName(user_name)
  if (!user) {
    res.view('dashboard-login', {
      viewFunctions: VIEW_FUNCTIONS,
      title: DASHBOARD_ADMIN_CONFIG.dashboardTitle,
      error_message: 'Not valid user',
      csrfToken: req.csrfToken(),
    })
    return
  }
  let result = await session.passwordIsEqual(user_pass, user.user_pass)
  if (!result) {
    res.view('dashboard-login', {
      title: DASHBOARD_ADMIN_CONFIG.dashboardTitle,
      error_message: 'No valid user',
      csrfToken: req.csrfToken(),
    })
    return
  }
  let roleExists = false
  for (let role of roles)
    if (role._id.toString() === user.user_role_ref.toString())
      roleExists = true
  if (!roleExists) {
    res.view('dashboard-login', {
      title: DASHBOARD_ADMIN_CONFIG.dashboardTitle,
      error_message: 'No valid user',
      csrfToken: req.csrfToken(),
    })
    return
  }
  req.session.user = {
    user_id: user._id.toString(),
    user_name: user.user_name,
    user_email: user.user_email,
    user_pass: user.user_pass,
    user_role: user.user_role,
    user_resource: user.user_resource,
    user_role_ref: user.user_role_ref,
  }
  res.redirect('dashboard')
}

exports.websiteDashboardLogout = async (req, res) => {
  if (req.session && req.session.user) {
    let userID = req.session.user.user_id
    req.sessionStore.destroy(req.session.sessionId)
    await session.removeUserSessionOnDB(userID)
    req.session = null
  }
  res.redirect('admin')
}

exports.websiteDashboardView = async (req, res) => {
  let userID = req.session.user.user_id
  let user = await userQuery.getByID(userID)
  res.view('dashboard-index', {
    viewFunctions: VIEW_FUNCTIONS,
    title: DASHBOARD_ADMIN_CONFIG.dashboardTitle,
    user_id: req.session.user.user_id,
    user_data: JSON.stringify(user),
  })
}

exports.websiteIndexView = async (req, res) => {
  let page = null
  let pageView = `${ SITE_CONFIG.siteTheme }/index`
  let templateHomeID = SITE_CONFIG.siteTemplateHome
  if (templateHomeID) {
    page = await pageQuery.getByID(templateHomeID)
    if (page && page.error) {
      res.code(500).send({
        status_code: 1,
        status_msg: 'Page Not Found',
      })
      return
    }
    if (page && page.page_template)
      pageView = `${ SITE_CONFIG.siteTheme }/${ page.page_template }`
  }
  res.view(pageView, {
    viewFunctions: VIEW_FUNCTIONS,
    themeDir: `view/${ SITE_CONFIG.siteTheme }/`,
    title: SITE_CONFIG.siteTitle,
    page: page,
  })
}

exports.websitePageView = async (req, res) => {
  let pageSlug = req.params.slug
  let pageView = `${ SITE_CONFIG.siteTheme }/page-detail`
  let page = await pageQuery.getDocumentBySlug(pageSlug)
  if (!page) {
    const urlData = req.urlData()
    res.code(404).view('404', {
      title: SITE_CONFIG.siteTitle,
      status: 'Page not found',
      error_message: `Route: ${ urlData.path } Not found.`,
    })
    return
  }
  if (page.error) {
    let statusCode = page.error.statusCode >= 400 ? page.error.statusCode : 500
    res.code(statusCode).view('500', {
      title: SITE_CONFIG.siteTitle,
      status: 'Server error!',
      error_message: statusCode >= 500 ? 'Internal server error' : page.error.message,
    })
  }
  if (page.page_template)
    pageView = `${ SITE_CONFIG.siteTheme }/${ page.page_template }`
  res.view(pageView, {
    viewFunctions: VIEW_FUNCTIONS,
    themeDir: `view/${ SITE_CONFIG.siteTheme }/`,
    title: SITE_CONFIG.siteTitle,
    page: page,
  })
}

exports.websiteBlogArchiveView = async (req, res) => {
  res.redirect('/blog/page/1')
}

exports.websiteBlogArchivePaginatedView = async (req, res) => {
  let currentPage = req.params.page
  let skipItems = SITE_CONFIG.siteItemsPeerPage * (currentPage - 1)
  let totalItems = await postQuery.getTotalItems()
  let ascSort = -1
  let items = await postQuery.getItemsByPage({
    skip: skipItems,
    limit: SITE_CONFIG.siteItemsPeerPage,
    sort: { 'post_date': ascSort },
  })
  if (items.error) {
    let statusCode = items.error.statusCode >= 400 ? items.error.statusCode : 500
    res.code(statusCode).view('500', {
      title: SITE_CONFIG.siteTitle,
      status: 'Server error!',
      error_message: statusCode >= 500 ? 'Internal server error' : items.error.message,
    })
    return
  }
  let view = `${ SITE_CONFIG.siteTheme }/post-list`
  if (SITE_CONFIG.siteTemplatePosts)
    view = `${ SITE_CONFIG.siteTheme }/${ SITE_CONFIG.siteTemplatePosts }`
  res.view(view, {
    viewFunctions: VIEW_FUNCTIONS,
    themeDir: `view/${ SITE_CONFIG.siteTheme }/`,
    title: SITE_CONFIG.siteTitle,
    items: items,
    total_pages: Math.ceil(totalItems / SITE_CONFIG.siteItemsPeerPage),
    items_skipped: skipItems,
    total_items: totalItems,
    current_page: currentPage,
    items_peer_page: SITE_CONFIG.siteItemsPeerPage,
    pagination_items: 2,
  })
}

exports.websiteBlogSingleView = async (req, res) => {
  let postSlug = req.params.slug
  let post = await postQuery.getDocumentBySlug(postSlug)
  if (!post) {
    const urlData = req.urlData()
    res.code(404).view('404', {
      title: SITE_CONFIG.siteTitle,
      status: 'Page not found',
      error_message: `Route: ${ urlData.path } Not found.`,
    })
    return
  }
  if (post.error) {
    let statusCode = post.error.statusCode >= 400 ? post.error.statusCode : 500
    res.code(statusCode).view('500', {
      title: SITE_CONFIG.siteTitle,
      status: 'Server error!',
      error_message: statusCode >= 500 ? 'Internal server error' : post.error.message,
    })
    return
  }
  res.view(`${ SITE_CONFIG.siteTheme }/post-detail`, {
    viewFunctions: VIEW_FUNCTIONS,
    themeDir: `view/${ SITE_CONFIG.siteTheme }/`,
    title: SITE_CONFIG.siteTitle,
    post: post,
  })
}

exports.websiteRecoverAccountView = async (req, res) => {
  res.view('recover-account', {
    viewFunctions: VIEW_FUNCTIONS,
    title: 'RECOVER ACCOUNT',
    error_message: req.query.error_message,
    success_message: req.query.success_message,
    csrfToken: req.csrfToken(),
  })
}

exports.websiteRecoverAccount = async (req, res) => {
  if (req.validationError) {
    let fisrtMessage = req.validationError.validation[0]
    res.view('recover-account', {
      title: 'RECOVER ACCOUNT',
      error_message: fisrtMessage.message,
      success_message: '',
      csrfToken: req.csrfToken(),
    })
    return
  }
  if (!req.body.email_address) {
    let errorMessage = 'Enter a email'
    res.redirect(`/recover-account/?error_message=${ errorMessage }`)
    return
  }
  let user = await userQuery.getByEmail(req.body.email_address)
  if (!user.length) {
    let errorMessage = 'Not email address found'
    res.redirect(`/recover-account/?error_message=${ errorMessage }`)
    return
  }
  crypto.pseudoRandomBytes(16, (err, raw) => {
    if (err) {
      let errorMessage = 'Try Again'
      res.redirect(`/recover-account/?error_message=${ errorMessage }`)
      return
    }
    user = user[0]
    let emailSubject = 'Reactive CMS - Recover Account'
    let hexString = `${ raw.toString('hex') }${ dateTime.create().format('YmdHMS') }`
    let emailURL = `${ APP_CONFIG.domain }/reset-password/${ hexString }`
    req.session.recoverAccountToken = hexString
    req.session.recoverAccountUserId = user._id
    let emailHTMLMessage = `<h1>Hi ${ user.user_first_name }!</h1><br />`
    emailHTMLMessage += 'You requested the reset password of your account<br />'
    emailHTMLMessage += 'You can reset your password using the next URL in the same browser where you requested the reset password<br />'
    emailHTMLMessage += `${ emailURL }<br />`
    emailHTMLMessage += '<br />Thank you for use Reactive CMS :)<br />'
    mail.sendEmail({
      to: user.user_email,
      subject: emailSubject,
      html: emailHTMLMessage,
    })
    let successMessage = `We sent a email to: ${ user.user_email }`
    res.redirect(`/recover-account/?success_message=${ successMessage }`)
  })
}

exports.websiteResetPasswordView = async (req, res) => {
  let error = false
  if (!req.params.token)
    error = true

  if (req.session.recoverAccountToken === req.params.token) {
    res.view('reset-password', {
      viewFunctions: VIEW_FUNCTIONS,
      title: 'RESET PASSOWRD',
      error_message: '',
      success_message: '',
      csrfToken: req.csrfToken(),
    })
  } else
    error = true
  if (error) {
    const urlData = req.urlData()
    res.code(404).view('404', {
      title: SITE_CONFIG.siteTitle,
      status: 'Page not found',
      error_message: `Route: ${ urlData.path } Not found.`,
    })
  }
}

exports.websiteResetPassword = async (req, res) => {
  if (req.validationError) {
    let fisrtMessage = req.validationError.validation[0]
    res.view('recover-account', {
      title: 'RECOVER ACCOUNT',
      error_message: fisrtMessage.message,
      success_message: '',
      csrfToken: req.csrfToken(),
    })
    return
  }
  if (!req.session.recoverAccountUserId || !req.session.recoverAccountToken) {
    res.code(500).view('500', {
      title: SITE_CONFIG.siteTitle,
      status: 'Error!',
      error_message: 'Internal server error',
    })
    return
  }
  if (!req.body.new_password) {
    res.view('reset-password', {
      viewFunctions: VIEW_FUNCTIONS,
      title: 'RESET PASSOWRD',
      error_message: 'Fill password field',
      success_message: '',
      csrfToken: req.csrfToken(),
    })
    return
  }
  let newPassword = await session.hashPassword(req.body.new_password)
  let userUpdated = await userQuery.updateByID({
    id: req.session.recoverAccountUserId,
    update_fields: {
      user_pass: newPassword,
    },
  })
  req.session.recoverAccountToken = null
  req.session.recoverAccountUserId = null
  let emailSubject = `${ DASHBOARD_ADMIN_CONFIG.dashboardTitle } - Recover Account`
  let emailHTMLMessage = `<h1>Hi ${ userUpdated.user_first_name }!</h1><br />`
  emailHTMLMessage += 'Your password has been changed<br />'
  emailHTMLMessage += `<br />Thank you for use ${ DASHBOARD_ADMIN_CONFIG.dashboardTitle } :)<br />`
  mail.sendEmail({
    to: userUpdated.user_email,
    subject: emailSubject,
    html: emailHTMLMessage,
  })
  res.redirect('/admin')
}
