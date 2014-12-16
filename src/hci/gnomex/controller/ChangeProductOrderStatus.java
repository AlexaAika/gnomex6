package hci.gnomex.controller;

import java.io.Serializable;
import java.io.StringReader;
import java.util.Iterator;
import java.util.List;
import java.util.Set;

import hci.framework.control.Command;
import hci.framework.control.RollBackCommandException;
import hci.gnomex.model.AnalysisExperimentItem;
import hci.gnomex.model.ProductLineItem;
import hci.gnomex.model.ProductOrder;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

import org.hibernate.Query;
import org.hibernate.Session;
import org.jdom.Document;
import org.jdom.Element;
import org.jdom.JDOMException;
import org.jdom.input.SAXBuilder;

public class ChangeProductOrderStatus extends GNomExCommand implements Serializable {
  private static org.apache.log4j.Logger log = org.apache.log4j.Logger.getLogger(SaveProductOrder.class);

  private String selectedOrdersXMLString;
  private String selectedlineItemsXMLString;
  private String codeProductOrderStatus;
  private Document orderDoc;
  private Document lineItemDoc;

  public void loadCommand(HttpServletRequest request, HttpSession sess) {

    if(request.getParameter("selectedOrders") != null && !request.getParameter("selectedOrders").equals("") ) {
      selectedOrdersXMLString = request.getParameter("selectedOrders");
      
      StringReader reader = new StringReader(selectedOrdersXMLString);
      try {
        SAXBuilder sax = new SAXBuilder();
        orderDoc = sax.build(reader);
      } catch (JDOMException je ) {
        log.error( "Cannot parse selectedOrdersXMLString", je );
        this.addInvalidField( "selectedOrdersXMLString", "Invalid selectedOrders xml");
      }
      
    } else if(request.getParameter("selectedLineItems") != null && !request.getParameter("selectedLineItems").equals("") ) {
      selectedlineItemsXMLString = request.getParameter("selectedLineItems");
      StringReader reader = new StringReader(selectedlineItemsXMLString);
      try {
        SAXBuilder sax = new SAXBuilder();
        lineItemDoc = sax.build(reader);
      } catch (JDOMException je ) {
        log.error( "Cannot parse selectedlineItemsXMLString", je );
        this.addInvalidField( "selectedlineItemsXMLString", "Invalid selectedlineItems xml");
      }
    } else {
      this.addInvalidField("lineItemsXMLString", "Missing line item list");
    }

    if(request.getParameter("codeProductOrderStatus") != null && !request.getParameter("codeProductOrderStatus").equals("") ) {
      codeProductOrderStatus = request.getParameter("codeProductOrderStatus");
    } else {
      this.addInvalidField("codeProductOrderStatus", "Missing codeProductOrderStatus");
    }

  }

  public Command execute() throws RollBackCommandException {
    try {
      if(this.isValid()) {
        Session sess = this.getSecAdvisor().getHibernateSession(this.getUsername());

        if ( orderDoc != null ) {
          for(Iterator i = orderDoc.getRootElement().getChildren().iterator(); i.hasNext();) {
            Element n = (Element)i.next();
            Integer idProductOrder = Integer.valueOf(n.getAttributeValue("idProductOrder"));
            ProductOrder po = (ProductOrder)sess.load(ProductOrder.class, idProductOrder);
            for (ProductLineItem li : (Set<ProductLineItem>)po.getProductLineItems()) {
              li.setCodeProductOrderStatus(codeProductOrderStatus);
              sess.update(li);
            }
          }
        }
        if ( lineItemDoc != null ) {
          for(Iterator i = lineItemDoc.getRootElement().getChildren().iterator(); i.hasNext();) {
            Element n = (Element)i.next();
            Integer idProductLineItem = Integer.valueOf(n.getAttributeValue("idProductLineItem"));
            ProductLineItem pli = (ProductLineItem)sess.load(ProductLineItem.class, idProductLineItem);
            pli.setCodeProductOrderStatus(codeProductOrderStatus);
            sess.update(pli);
          }
        }
        sess.flush();
        this.setResponsePage(this.SUCCESS_JSP);
      } else {
        this.setResponsePage(this.ERROR_JSP);
      }
    }catch(Exception e) {
      log.error("An exception has occurred in ChangeProductOrderStatus ", e);
      e.printStackTrace();
      throw new RollBackCommandException(e.getMessage()); 
    }finally {
      try {
        this.getSecAdvisor().closeHibernateSession();
      } catch(Exception e) {
      }
    }
    return this;
  }


  public void validate() {

  }

}
