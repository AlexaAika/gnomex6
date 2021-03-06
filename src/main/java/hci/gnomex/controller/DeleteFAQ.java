package hci.gnomex.controller;

import hci.framework.control.Command;
import hci.gnomex.utility.HttpServletWrappedRequest;
import hci.gnomex.utility.Util;
import hci.framework.control.RollBackCommandException;
import hci.gnomex.model.PropertyDictionary;
import hci.gnomex.model.TransferLog;
import hci.gnomex.model.FAQ;
import hci.gnomex.utility.DictionaryHelper;
import hci.gnomex.utility.HibernateSession;
import hci.gnomex.utility.PropertyDictionaryHelper;

import java.io.Serializable;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

import org.hibernate.Hibernate;
import org.hibernate.Session;
import org.apache.log4j.Logger;
public class DeleteFAQ extends GNomExCommand implements Serializable {

  // the static field for logging in Log4J
  private static Logger LOG = Logger.getLogger(DeleteFAQ.class);

  private Integer idFAQ = null;

  public void validate() {
  }

  public void loadCommand(HttpServletWrappedRequest request, HttpSession session) {

   if (request.getParameter("idFAQ") != null && !request.getParameter("idFAQ").equals("")) {
     idFAQ = new Integer(request.getParameter("idFAQ"));
   } else {
     this.addInvalidField("idFAQ", "idFAQ is required.");
   }
  }

  public Command execute() throws RollBackCommandException {
    try {

      Session sess = HibernateSession.currentSession(this.getUsername());
      DictionaryHelper dh = DictionaryHelper.getInstance(sess);
      FAQ FAQ = (FAQ)sess.load(FAQ.class, idFAQ);

      if (this.getSecAdvisor().canDelete(FAQ)) {

        //
        // Delete FAQ
        //
        sess.delete(FAQ);
        sess.flush();

        this.xmlResult = "<SUCCESS/>";
        setResponsePage(this.SUCCESS_JSP);

      } else {
        this.addInvalidField("Insufficient permissions", "Insufficient permissions to delete this FAQ.");
        setResponsePage(this.ERROR_JSP);
      }
    }catch (Exception e){
      this.errorDetails = Util.GNLOG(LOG,"An exception has occurred in DeleteFAQ", e);

      throw new RollBackCommandException(e.getMessage());

    }

    return this;
  }
}
