package hci.gnomex.model;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Set;

import hci.gnomex.utility.UserPreferences;
import hci.gnomex.utility.Util;
import org.hibernate.Session;
import org.jdom.Element;

import hci.gnomex.utility.DetailObject;
import hci.gnomex.utility.XMLTools;
import hci.hibernate5utils.HibernateDetailObject;

@SuppressWarnings("serial")
public class BillingTemplateItem extends HibernateDetailObject implements Comparable<BillingTemplateItem>, DetailObject {
	
	public static final BigDecimal	WILL_TAKE_REMAINING_BALANCE = BigDecimal.valueOf(-1.0);
	
	private Integer					idBillingTemplateItem;
	private Integer 				idBillingTemplate;
	private Integer 				idBillingAccount;
	private BigDecimal 				percentSplit;
	private BigDecimal 				dollarAmount;
	private BigDecimal				dollarAmountBalance;

	public BillingTemplateItem() {
		super();
	}
	
	public BillingTemplateItem(BillingTemplate template) {
		this();
		
		this.setIdBillingTemplate(template.getIdBillingTemplate());
	}
	
	public boolean isAcceptingBalance() {
		return (percentSplit != null && percentSplit.compareTo(WILL_TAKE_REMAINING_BALANCE) == 0) || (dollarAmount != null && dollarAmount.compareTo(WILL_TAKE_REMAINING_BALANCE) == 0);
	}
	
	@Override
	public int hashCode() {
		final int prime = 31;
		int result = 1;
		result = prime * result + ((this.getIdBillingTemplateItem() == null) ? super.hashCode() : this.getIdBillingTemplateItem().hashCode());
		return result;
	}
	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (obj == null)
			return false;
		if (!(obj instanceof BillingTemplateItem))
			return false;
		BillingTemplateItem other = (BillingTemplateItem) obj;
		if (this.getIdBillingTemplateItem() == null) {
			if (other.getIdBillingTemplateItem() != null)
				return false;
		} else if (!this.getIdBillingTemplateItem().equals(other.getIdBillingTemplateItem()))
			return false;
		return true;
	}
	public Integer getIdBillingTemplateItem() {
		return this.idBillingTemplateItem;
	}
	public void setIdBillingTemplateItem(Integer idBillingTemplateItem) {
		this.idBillingTemplateItem = idBillingTemplateItem;
	}
	public Integer getIdBillingTemplate() {
		return this.idBillingTemplate;
	}
	public void setIdBillingTemplate(Integer idBillingTemplate) {
		this.idBillingTemplate = idBillingTemplate;
	}
	public Integer getIdBillingAccount() {
		return this.idBillingAccount;
	}
	public void setIdBillingAccount(Integer idBillingAccount) {
		this.idBillingAccount = idBillingAccount;
	}
	public BigDecimal getPercentSplit() {
		return this.percentSplit;
	}
	public void setPercentSplit(BigDecimal percentSplit) {
		if (percentSplit != null) {
			this.percentSplit = percentSplit.setScale(3, RoundingMode.HALF_EVEN);
			this.setDollarAmount(null);
			this.setDollarAmountBalance(null);
		} else {
			this.percentSplit = percentSplit;
		}
	}
	public BigDecimal getDollarAmount() {
		return this.dollarAmount;
	}
	public void setDollarAmount(BigDecimal dollarAmount) {
		if (dollarAmount != null) {
			this.dollarAmount = dollarAmount.setScale(2, RoundingMode.HALF_EVEN);
			this.setPercentSplit(null);
		} else {
			this.dollarAmount = dollarAmount;
		}
	}
	public BigDecimal getDollarAmountBalance() {
		return this.dollarAmountBalance;
	}
	public void setDollarAmountBalance(BigDecimal dollarAmountBalance) {
		if (dollarAmountBalance != null) {
			this.dollarAmountBalance = dollarAmountBalance.setScale(2, RoundingMode.HALF_EVEN);
		} else {
			this.dollarAmountBalance = dollarAmountBalance;
		}
	}

	@Override
	public int compareTo(BillingTemplateItem o) {
		// The template billing item accepting the balance should be sorted into the last position
		// because the billing item code expects this order when computing costs.
		if (this.isAcceptingBalance() && !o.isAcceptingBalance()) {
			return 1;
		}
		if (!this.isAcceptingBalance() && o.isAcceptingBalance()) {
			return -1;
		}
		// Otherwise the order does not matter, use a unique field for comparison
		return this.idBillingAccount - o.idBillingAccount;
	}

	@Override
	public Element toXML(Session sess, Set<String> detailParameters, UserPreferences userPreferences) {
		Element billingTemplateItemNode = new Element("BillingTemplateItem");
		
		billingTemplateItemNode.setAttribute("idBillingTemplateItem", XMLTools.safeXMLValue(this.getIdBillingTemplateItem()));
		billingTemplateItemNode.setAttribute("idBillingTemplate", XMLTools.safeXMLValue(this.getIdBillingTemplate()));
		billingTemplateItemNode.setAttribute("idBillingAccount", XMLTools.safeXMLValue(this.getIdBillingAccount()));
		// Return percent split as a percent instead of a decimal value
		billingTemplateItemNode.setAttribute("percentSplit", this.getPercentSplit()!=null ? XMLTools.safeXMLValue(this.getPercentSplit().multiply( new BigDecimal(100) )) : "");
		billingTemplateItemNode.setAttribute("dollarAmount", XMLTools.safeXMLValue(this.getDollarAmount()));
		billingTemplateItemNode.setAttribute("dollarAmountBalance", XMLTools.safeXMLValue(this.getDollarAmountBalance()));
		billingTemplateItemNode.setAttribute("acceptBalance", this.isAcceptingBalance() ? "true" : "false");
		
		BillingAccount billingAccount = sess.load(BillingAccount.class, this.getIdBillingAccount());
		if (billingAccount != null) {
			billingTemplateItemNode.setAttribute("accountName", XMLTools.safeXMLValue(billingAccount.getAccountName()));
			billingTemplateItemNode.setAttribute("accountNumber", XMLTools.safeXMLValue(billingAccount.getAccountNumber()));
			billingTemplateItemNode.setAttribute("accountNumberDisplay", XMLTools.safeXMLValue(billingAccount.getAccountNumberDisplay()));
			Lab lab = billingAccount.getLab();
			if (lab != null) {
				billingTemplateItemNode.setAttribute("idLab", XMLTools.safeXMLValue(lab.getIdLab()));
				billingTemplateItemNode.setAttribute("labName", Util.getLabDisplayName(lab, userPreferences));
			}
		}
		
		return billingTemplateItemNode;
	}

}
