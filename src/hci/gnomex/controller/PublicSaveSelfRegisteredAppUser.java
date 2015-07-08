package hci.gnomex.controller;

import hci.framework.control.Command;
import hci.framework.control.RollBackCommandException;
import hci.gnomex.constants.Constants;
import hci.gnomex.model.AppUser;
import hci.gnomex.model.CoreFacility;
import hci.gnomex.model.Lab;
import hci.gnomex.model.PropertyDictionary;
import hci.gnomex.model.UserPermissionKind;
import hci.gnomex.security.EncrypterService;
import hci.gnomex.security.EncryptionUtility;
import hci.gnomex.utility.DictionaryHelper;
import hci.gnomex.utility.HibernateSession;
import hci.gnomex.utility.MailUtil;
import hci.gnomex.utility.PropertyDictionaryHelper;

import java.io.Serializable;
import java.sql.Timestamp;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.UUID;

import javax.mail.MessagingException;
import javax.mail.internet.AddressException;
import javax.mail.internet.InternetAddress;
import javax.naming.NamingException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

import org.apache.commons.validator.routines.EmailValidator;
import org.hibernate.Query;
import org.hibernate.Session;


public class PublicSaveSelfRegisteredAppUser extends GNomExCommand implements Serializable {



  // the static field for logging in Log4J
  private static org.apache.log4j.Logger log = org.apache.log4j.Logger.getLogger(PublicSaveSelfRegisteredAppUser.class);


  private AppUser        appUserScreen;
  private PropertyDictionaryHelper propertyHelper = null;
  private String         coreFacilityEmail = null;
  private String         requestedLabName = "";
  private Integer        requestedLabId = null;
  private Lab            requestedLab = null;
  private StringBuffer   requestURL;
  private Boolean        existingLab = false;
  private Boolean        uofuAffiliate = false;
  private CoreFacility   facility = null;
  private String         idFacility = null;
  private String         department = null;
  private String		 contactEmail = null;
  private String		 contactPhone = null;
  private String         serverName;
  private List           activeFacilities;

  public String responsePageSuccess = null;
  public String responsePageError = null;

  private final static int APPROVE_USER_EXPIRATION_TIME = 86400000;  //One day

  public void loadCommand(HttpServletRequest request, HttpSession session) {
    serverName = request.getServerName();
    this.requestURL = request.getRequestURL(); 
    appUserScreen = new AppUser();
    HashMap errors = this.loadDetailObject(request, appUserScreen);
    this.addInvalidFields(errors);
    if (request.getParameter("uofuAffiliate") != null && request.getParameter("uofuAffiliate").equals("y")) {
      uofuAffiliate = true;
      appUserScreen.setUserNameExternal("");
      appUserScreen.setPasswordExternal("");
      appUserScreen.setInstitute("University of Utah");
    } else {
      uofuAffiliate = false;
      appUserScreen.setuNID("");
    }

    // Trim uNID, external user name, removing trailing spaces
    if (appUserScreen.getuNID() != null) {
      appUserScreen.setuNID(appUserScreen.getuNID().trim());
    }
    if (appUserScreen.getUserNameExternal() != null) {
      appUserScreen.setUserNameExternal(appUserScreen.getUserNameExternal().trim());
    }

    if (request.getParameter("labDropdown") != null && Integer.parseInt(request.getParameter("labDropdown")) != 0 ) {
      existingLab = true;
      requestedLabId = Integer.parseInt(request.getParameter("labDropdown"));
      appUserScreen.setDepartment("");
    } else {
      existingLab = false;
      requestedLabName = request.getParameter("newLab");
      department = request.getParameter( "department" );
      contactEmail = request.getParameter("contactEmail");
      contactPhone = request.getParameter("contactPhone");
      appUserScreen.setDepartment( department );
    }

    if (request.getParameter("idFacility") != null && !request.getParameter("idFacility").equals("") ) {
      idFacility = request.getParameter("idFacility");
    } else {
      this.addInvalidField("facilityRqrd", "Please select a core facility");
    }


    if ((appUserScreen.getFirstName() == null || appUserScreen.getFirstName().equals("")) ||
        (appUserScreen.getLastName() == null || appUserScreen.getLastName().equals("")) ||
        (appUserScreen.getEmail() == null || appUserScreen.getEmail().equals("")) ||
        (appUserScreen.getPhone() == null || appUserScreen.getPhone().equals("")) ||
        ((requestedLabName == null || requestedLabName.equals("")) && requestedLabId == null) ||
        ((contactEmail == null || contactEmail.equals("")) && requestedLabId == null) ||
        ((contactPhone == null || contactPhone.equals("")) && requestedLabId == null)) {
      this.addInvalidField("requiredField", "Please fill out all mandatory fields.  Mandatory fields are marked with an asterisk(*).");
    }

    if(appUserScreen.getFirstName() != null && appUserScreen.getLastName() != null){
      //if(!appUserScreen.getFirstName().matches("[A-Za-z]+") || !appUserScreen.getLastName().matches("[A-Za-z]+")){
      if(appUserScreen.getFirstName().matches(".*[0-9].*") || appUserScreen.getLastName().matches(".*[0-9].*")){
        this.addInvalidField("improperName", "First and last names may not contain digits");
      }
    }

    if (uofuAffiliate && (appUserScreen.getuNID() == null || this.appUserScreen.getuNID().equals(""))) {
      this.addInvalidField("userNameRequiredField", "University Id is required");        
    }

    if(appUserScreen.getuNID() != null && !appUserScreen.getuNID().equals("") ){
      if(appUserScreen.getuNID().charAt(0) != 'u' || appUserScreen.getuNID().trim().length() != 8 || !appUserScreen.getuNID().trim().substring(1).matches("[0-9]+")){
        this.addInvalidField("incorrectUNIDFormat", "Your University ID must start with lowercase 'u' followed by 7 digits");
      }
    }

    if (!uofuAffiliate && (appUserScreen.getUserNameExternal() == null || this.appUserScreen.getUserNameExternal().equals(""))) {
      this.addInvalidField("userNameRequiredField", "User name is required");
    }

    if (!uofuAffiliate) {
      if (appUserScreen.getPasswordExternal() == null || appUserScreen.getPasswordExternal().equals(""))
        this.addInvalidField("passwordRqrd", "Password is required");
    }

    if (request.getParameter("responsePageSuccess") != null && !request.getParameter("responsePageSuccess").equals("")) {
      responsePageSuccess = request.getParameter("responsePageSuccess");
    }
    if (request.getParameter("responsePageError") != null && !request.getParameter("responsePageError").equals("")) {
      responsePageError = request.getParameter("responsePageError");
    }

    if (appUserScreen.getEmail() != null && !appUserScreen.getEmail().equals("")) {
      try {
        InternetAddress addresses[] = InternetAddress.parse(appUserScreen.getEmail(), true);
        if (addresses.length > 1) {
          this.addInvalidField("email", "Email address cannot contain spaces");
        }
        if (!EmailValidator.getInstance().isValid(appUserScreen.getEmail())) {
          this.addInvalidField("email", "Email address is not valid.  Please check the email address and try again.");
        }
      } catch(AddressException ex) {
        this.addInvalidField("email", "Invalid Email Address -- " + ex.toString());
      }
    }
    // Validate PI email if given
    if (contactEmail != null && !contactEmail.equals("")) {
        try {
          InternetAddress addresses[] = InternetAddress.parse(contactEmail, true);
          if (addresses.length > 1) {
            this.addInvalidField("contactEmail", "PI Email address cannot contain spaces");
          }
          if (!EmailValidator.getInstance().isValid(contactEmail)) {
            this.addInvalidField("contactEmail", "PI Email address is not valid.  Please check the email address and try again.");
          }
        } catch(AddressException ex) {
          this.addInvalidField("contactEmail", "Invalid PI Email Address -- " + ex.toString());
        }
    }
    this.validate();
  }

  public Command execute() throws RollBackCommandException {

    try {
      Session sess = HibernateSession.currentSession(this.getUsername());
      propertyHelper = PropertyDictionaryHelper.getInstance(sess);
      EncryptionUtility passwordEncrypter = new EncryptionUtility();

      String disableSignup = propertyHelper.getProperty(PropertyDictionary.DISABLE_USER_SIGNUP);
      if (disableSignup != null && disableSignup.equals("Y")) {
        this.addInvalidField("Signup disabled", "User signup is disabled");
      }

      // Get core facilities.
      activeFacilities = CoreFacility.getActiveCoreFacilities(sess);
      if (activeFacilities.size() == 1) {
        facility = (CoreFacility)activeFacilities.get(0);
      } else if (idFacility != null && idFacility.length() > 0) {
        Integer id = Integer.parseInt(idFacility);
        facility = (CoreFacility)sess.load(CoreFacility.class, id);
      }

      AppUser appUser = null;

      if(!uofuAffiliate) {
        if (userNameAlreadyExists(sess, appUserScreen.getUserNameExternal(), null)) {
          this.addInvalidField("Username exists", "The user name " + appUserScreen.getUserNameExternal() + " already exists.  Please use another name.");
        }            
      } else {
        if (uNID_AlreadyExists(sess, appUserScreen.getuNID(), null)) {
          this.addInvalidField("uNID exists", "The uNID " + appUserScreen.getuNID() + " already exists.  Please use another.");
        }            
      }      

      if (nameEmailAlreadyExists(sess, appUserScreen)) {
        this.addInvalidField("Name/Email", "The combination of name and email already exists.  Please verify you do not have an existing account.");
      }

      if (existingLab) {
        requestedLab = (Lab)sess.load(Lab.class, requestedLabId);
        requestedLabName = requestedLab.getName(false, false);
      }

      if (facility == null) {
        if (requestedLab == null || requestedLab.getCoreFacilities().size() != 1) {
          coreFacilityEmail = propertyHelper.getProperty(PropertyDictionary.GENERIC_NO_REPLY_EMAIL);
        } else {
          coreFacilityEmail = ((CoreFacility)requestedLab.getCoreFacilities().toArray()[0]).getContactEmail();
        }
      } else {
        if( existingLab && !requestedLab.getCoreFacilities().contains( facility ) ) {
          requestedLab.getCoreFacilities().add( facility );
        }
        coreFacilityEmail = facility.getContactEmail();
      }

      if (this.isValid()) {
        // Send user email before storing app user so if it fails we can give error without
        // throwing exception
        try {
          sendUserEmail(appUserScreen, sess);
        } catch(Exception e) {
          log.error("An exception occurred sending the user email ", e);
          e.printStackTrace();
          this.addInvalidField("email", "Unable to send email.  Please check your email address and try again.");
        }
      }

      if (this.isValid()) {
        appUser = appUserScreen;

        if (appUser.getuNID() != null && 
            !appUser.getuNID().trim().equals("")) {
          appUser.setUserNameExternal(null);
          appUser.setPasswordExternal(null);

        } else {
          if (appUser.getUserNameExternal() != null  && !appUser.getUserNameExternal().trim().equals("")) {
            appUser.setuNID(null);
          }
          if (appUser.getPasswordExternal() != null && !appUser.getPasswordExternal().equals("") && !appUser.getPasswordExternal().equals(AppUser.MASKED_PASSWORD)) {
            String salt = passwordEncrypter.createSalt();
            String encryptedPassword = passwordEncrypter.createPassword(appUser.getPasswordExternal(), salt);
            appUser.setSalt(salt);
            appUser.setPasswordExternal(encryptedPassword);      
          }

        }

        // Default to inactive
        appUser.setIsActive("N");

        // Default to Lab permission kind
        appUser.setCodeUserPermissionKind(UserPermissionKind.GROUP_PERMISSION_KIND);

        // Set lab if selected
        if (existingLab) {
          HashSet labSet = new HashSet();
          labSet.add(this.requestedLab);
          appUser.setLabs(labSet);
        }

        Timestamp ts = new Timestamp(System.currentTimeMillis() + PublicSaveSelfRegisteredAppUser.APPROVE_USER_EXPIRATION_TIME);
        appUser.setGuid((UUID.randomUUID().toString()));
        appUser.setGuidExpiration(ts);

        sess.save(appUser);
      }

      if (this.isValid()) {
        sendAdminEmail(appUser, sess);    
      }

      if (this.isValid()) {
        sess.flush();

        this.xmlResult = "<SUCCESS idAppUser=\"" + appUser.getIdAppUser() + "\"/>";
        setResponsePage(responsePageSuccess != null ? responsePageSuccess : this.SUCCESS_JSP);
      } else {
        setResponsePage(responsePageError != null ? responsePageError : this.ERROR_JSP);
      }

    } catch (Exception e) {
      log.error("An exception has occurred in SaveSelfRegisteredAppUser ", e);
      e.printStackTrace();
      throw new RollBackCommandException(e.getMessage());

    }finally {
      try {
        HibernateSession.closeSession();        
      } catch(Exception e) {

      }
    }

    return this;
  }

  private String getEmailBody(AppUser appUser, Boolean isAdmin) {
    StringBuffer body = new StringBuffer();
    body.append("<table border='0'><tr><td>Last name:</td><td>" + this.getNonNullString(appUser.getLastName()));
    body.append("</td></tr><tr><td>First name:</td><td>" + this.getNonNullString(appUser.getFirstName()));
    if (existingLab) {
      body.append("</td></tr><tr><td>Lab:</td><td>" + this.getNonNullString(requestedLabName));
      if (activeFacilities.size() > 1) {
        body.append("</td></tr><tr><td>Core Facility:</td><td>" + this.getNonNullString(facility.getFacilityName()));
      }
    } else {
      if(isAdmin) {
        body.append("</td></tr><tr style=\"color:red\"><td>Lab (New. Please add to GNomEx.):</td><td>" + this.getNonNullString(requestedLabName));
        body.append("</td></tr><tr style=\"color:red\"><td>Department:</td><td>" + this.getNonNullString(appUser.getDepartment()));
        body.append("</td></tr><tr style=\"color:red\"><td>PI Email:</td><td>" + this.getNonNullString(contactEmail));
        body.append("</td></tr><tr style=\"color:red\"><td>PI Phone:</td><td>" + this.getNonNullString(contactPhone));
      } else {
        body.append("</td></tr><tr><td>Lab (New. Please add to GNomEx.):</td><td>" + this.getNonNullString(requestedLabName));
        body.append("</td></tr><tr><td>Department:</td><td>" + this.getNonNullString(appUser.getDepartment()));
        body.append("</td></tr><tr><td>PI Email:</td><td>" + this.getNonNullString(contactEmail));
        body.append("</td></tr><tr><td>PI Phone:</td><td>" + this.getNonNullString(contactPhone));
      }
      if (activeFacilities.size() > 1) {
        body.append("</td></tr><tr><td>Core Facility:</td><td>" + this.getNonNullString(facility.getFacilityName()));
      }
    }
    body.append("</td></tr><tr><td>Institution:</td><td>" + this.getNonNullString(appUser.getInstitute()));
    body.append("</td></tr><tr><td>Email:</td><td>" + this.getNonNullString(appUser.getEmail()));
    body.append("</td></tr><tr><td>Phone:</td><td>" + this.getNonNullString(appUser.getPhone()));
    if(appUser.getuNID() != null && appUser.getuNID().length() > 0) {
      body.append("</td></tr><tr><td>University uNID:</td><td>" + this.getNonNullString(appUser.getuNID()));
    } else {
      body.append("</td></tr><tr><td>Username:</td><td>" + this.getNonNullString(appUser.getUserNameExternal()));    
    }
    body.append("</td></tr></table>");

    return body.toString();
  }

  private void sendUserEmail(AppUser appUser, Session sess)  throws NamingException, MessagingException {
	DictionaryHelper dictionaryHelper = DictionaryHelper.getInstance(sess);
	
    StringBuffer intro = new StringBuffer();
    intro.append("Thank you for signing up for a GNomEx account.  We will send you an email once your user account has been activated.<br><br>");
    if(!existingLab) {
      intro.append("**Please note that you have requested a new lab in GNomEx.  You will not be able to submit experiments until your lab is verified and approved by the core facility manager.  You will be notified when you have been added to the lab.**.<br><br>");
    }


    if (appUser.getEmail().equals("bademail@bad.com")) {
      throw new AddressException("'bademail@bad.com' not allowed");
    }

    if(!MailUtil.isValidEmail(appUser.getEmail())){
      log.error("Invalid Email Address " + appUser.getEmail());
    }

    MailUtil.validateAndSendEmail(	
    		appUser.getEmail(),
    		coreFacilityEmail,
    		"Your GNomEx user account has been created",
    		intro.toString() + getEmailBody(appUser, false),
			true, 
			dictionaryHelper,
			serverName 									);

  }

  private void sendAdminEmail(AppUser appUser, Session sess)  throws NamingException, MessagingException {
    //This is to send it to the right application server, without hard coding
    String url = requestURL.substring(0, requestURL.indexOf("PublicSaveSelfRegisteredAppUser.gx"));
    DictionaryHelper dictionaryHelper = DictionaryHelper.getInstance(sess);

    if (appUser.getEmail().equals("bademail@bad.com")) {
      throw new AddressException("'bademail@bad.com' not allowed");
    }

    String toAddress = "";
    String ccAddress = "";
    String subject = "GNomEx user account pending approval for " + appUser.getFirstName() + " " + appUser.getLastName();
   
    //we will send activation email to lab pi if user requests membership to existing lab.  If new lab or no pi email the activation email will go to core facility director.
    if(requestedLab != null && requestedLab.getContactEmail() != null && !requestedLab.getContactEmail().equals("")) {
      toAddress += requestedLab.getContactEmail();
    }

    
    //We will send same email to the core facility director.
    if (facility != null) {
      String coreEmail =  propertyHelper.getQualifiedCoreFacilityProperty(PropertyDictionary.CONTACT_EMAIL_CORE_FACILITY_WORKAUTH_REMINDER, serverName, facility.getIdCoreFacility());
      if (coreEmail == null) {
        coreEmail = facility.getContactEmail();
      }
      // If we already have a toAddress (PI email), add core email to cc.
      if ( toAddress.length() > 0 ) {
        ccAddress += coreEmail;
      } else {
        toAddress += coreEmail;
      }
    } else if (requestedLab != null) {
      // If we already have a toAddress (PI email), add core email to cc.
      if ( toAddress.length() > 0 ) {
        for(Iterator facilityIter = requestedLab.getCoreFacilities().iterator();facilityIter.hasNext();) {
          CoreFacility f = (CoreFacility)facilityIter.next();
          String add =  propertyHelper.getQualifiedCoreFacilityProperty(PropertyDictionary.CONTACT_EMAIL_CORE_FACILITY_WORKAUTH_REMINDER, serverName, f.getIdCoreFacility());
          if (add == null) {
            add = facility.getContactEmail();
          }
          if (add != null && add.length() > 0) {
            if (ccAddress != null && !ccAddress.equals("")) {
              ccAddress += ",";
            }
            ccAddress += add;
          }
        }
      } else {
        for(Iterator facilityIter = requestedLab.getCoreFacilities().iterator();facilityIter.hasNext();) {
          CoreFacility f = (CoreFacility)facilityIter.next();
          String add =  propertyHelper.getQualifiedCoreFacilityProperty(PropertyDictionary.CONTACT_EMAIL_CORE_FACILITY_WORKAUTH_REMINDER, serverName, f.getIdCoreFacility());
          if (add == null) {
            add = facility.getContactEmail();
          }
          if (add != null && add.length() > 0) {
            if (toAddress != null && !toAddress.equals("")) {
              toAddress += ",";
            }
            toAddress += add;
          }
        }
      }
      
    }

    // Add GNomEx support email to cc list
    if(propertyHelper.getProperty(PropertyDictionary.NOTIFY_SUPPORT_OF_NEW_USER).equals("Y")) {
      if(ccAddress.length() > 0) {
        ccAddress += ", ";
      }
      ccAddress += propertyHelper.getProperty(PropertyDictionary.GNOMEX_SUPPORT_EMAIL);
    }

    // Get approve and delete URLs
    String uuidStr = appUser.getGuid();
    String approveURL = url + "/" + Constants.APPROVE_USER_SERVLET + "?guid=" + uuidStr + "&idAppUser=" + appUser.getIdAppUser().intValue();
    String deleteURL = url + "/" + Constants.APPROVE_USER_SERVLET + "?guid=" + uuidStr + "&idAppUser=" + appUser.getIdAppUser().intValue() + "&deleteUser=Y";
    //url = url + Constants.LAUNCH_APP_JSP + "?idAppUser=" + appUser.getIdAppUser().intValue() + "&launchWindow=UserDetail&idCore=" + facility.getIdCoreFacility().toString();
    StringBuffer introForAdmin = new StringBuffer();
    
    
    // Intro to Lab PI/Admin
    String greeting = "";
    if ( requestedLab != null ) {
      greeting = "Dear " + requestedLab.getName( false, false, false ) + ",<br><br>";
    } 
    
    introForAdmin.append(greeting);
    introForAdmin.append("The following person has signed up for a GNomEx user account.  The user account has been created but not activated.<br><br>");
    introForAdmin.append("<a href='" + approveURL + "'>Click here</a> to activate the account.  GNomEx will automatically send an email to notify the user that his/her user account has been activated.<br><br>");
    introForAdmin.append("<a href='" + deleteURL + "'>Click here</a> to deny and delete the pending user.  GNomEx will automatically send an email to notify the user that they have been denied an account with GNomEx.<br><br>");
    
    String closing = "If you have any questions concerning this application for a new account within your lab group, pleast contact ";
    if (facility != null ) {
      closing += facility.getContactName() + " (" + facility.getContactEmail() + ").<br><br>";
    } else {
      closing += "GNomEx Support " + " (" + propertyHelper.getProperty( PropertyDictionary.GNOMEX_SUPPORT_EMAIL ) + ").<br><br>";
    }
    introForAdmin.append( closing );
    
    MailUtil.validateAndSendEmail(	
    		toAddress,
    		ccAddress,
    		null,
    		coreFacilityEmail,
    		subject,
    		introForAdmin.toString() + getEmailBody(appUser, true),
    		true, 
    		dictionaryHelper,
    		serverName 												);

  }

  public void validate() {
    // See if we have a valid form
    if (isValid()) {
      setResponsePage(responsePageSuccess != null ? responsePageSuccess : this.SUCCESS_JSP);
    } else {
      setResponsePage(responsePageError != null ? responsePageError : this.ERROR_JSP);
    }
  }

  private class AppUserComparator implements Comparator, Serializable {
    public int compare(Object o1, Object o2) {
      AppUser u1 = (AppUser)o1;
      AppUser u2 = (AppUser)o2;

      return u1.getIdAppUser().compareTo(u2.getIdAppUser());

    }
  }

  private static boolean userNameAlreadyExists(Session sess, String userNameExternal, Integer idAppUser) {
    if (userNameExternal == null || userNameExternal.equals("")) {
      return false;
    }

    StringBuffer buf = new StringBuffer();
    buf.append("SELECT a.userNameExternal from AppUser as a where a.userNameExternal = '"); 
    buf.append(userNameExternal + "'");
    if (idAppUser != null) {
      buf.append(" AND a.idAppUser != " + idAppUser);
    }
    List users = sess.createQuery(buf.toString()).list();
    return users.size() > 0;    
  }

  private static boolean uNID_AlreadyExists(Session sess, String uNID, Integer idAppUser) {
    if (uNID == null || uNID.equals("")) {
      return false;
    }

    StringBuffer buf = new StringBuffer();
    buf.append("SELECT a.uNID from AppUser as a where a.uNID = '"); 
    buf.append(uNID + "'");
    if (idAppUser != null) {
      buf.append(" AND a.idAppUser != " + idAppUser);
    }
    List users = sess.createQuery(buf.toString()).list();
    return users.size() > 0;    
  }

  private static boolean nameEmailAlreadyExists(Session sess, AppUser appUser) {
    if (appUser.getFirstName() == null || appUser.getLastName() == null || appUser.getEmail() == null) {
      return false;
    }

    StringBuffer buf = new StringBuffer();
    buf.append("SELECT a.uNID from AppUser as a where a.firstName = :firstName"); 
    buf.append(" and a.lastName = :lastName");
    buf.append(" and a.email = :email");
    if (appUser.getIdAppUser() != null) {
      buf.append(" AND a.idAppUser != :idAppUser");
    }

    Query usersQuery = sess.createQuery(buf.toString());

    usersQuery.setParameter("firstName", appUser.getFirstName());
    usersQuery.setParameter("lastName", appUser.getLastName());
    usersQuery.setParameter("email", appUser.getEmail());
    if (appUser.getIdAppUser() != null) {
      usersQuery.setParameter("idAppUser", appUser.getIdAppUser());
    }

    List users = usersQuery.list();
    return users.size() > 0;
  }
}