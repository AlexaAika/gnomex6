package hci.gnomex.billing;

import hci.gnomex.model.BillingItem;
import hci.gnomex.model.BillingPeriod;
import hci.gnomex.model.BillingStatus;
import hci.gnomex.model.Hybridization;
import hci.gnomex.model.LabeledSample;
import hci.gnomex.model.PlateType;
import hci.gnomex.model.PlateWell;
import hci.gnomex.model.Price;
import hci.gnomex.model.PriceCategory;
import hci.gnomex.model.PriceCriteria;
import hci.gnomex.model.PropertyEntry;
import hci.gnomex.model.Request;
import hci.gnomex.model.Sample;
import hci.gnomex.model.SequenceLane;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.hibernate.Session;


public class CapSeqTubePlugin implements BillingPlugin {

  public List constructBillingItems(Session sess, String amendState, BillingPeriod billingPeriod, PriceCategory priceCategory, Request request, 
      Set<Sample> samples, Set<LabeledSample> labeledSamples, Set<Hybridization> hybs, Set<SequenceLane> lanes, Map<String, ArrayList<String>> sampleToAssaysMap, 
      String billingStatus, Set<PropertyEntry> propertyEntries) {
    
    
    List billingItems = new ArrayList<BillingItem>();
    
    if (samples == null || samples.size() == 0) {
      return billingItems;
    }
    
    // Count number of samples, detect if samples submitted in plate wells
    int qty = 0;
    boolean sampleInPlateWell = false;
    for (Sample s : samples) {
      qty++;
      if (s.getWells() != null) {
        for (PlateWell w : (Set<PlateWell>)s.getWells()) {
          if (w.getPlate() != null && w.getPlate().getCodePlateType().equals(PlateType.SOURCE_PLATE_TYPE)) {
            sampleInPlateWell = true;
          }
        }
      }
    }
    // This billing plug-in only applies for samples submitted in tubes
    if (sampleInPlateWell) {
      return billingItems;
    }

    
    // Find the price for capillary sequencing
    Price price = null;
    for(Iterator i1 = priceCategory.getPrices().iterator(); i1.hasNext();) {
      Price p = (Price)i1.next();
      if (p.getIsActive() != null && p.getIsActive().equals("Y")) {
        // Pricing for capillary sequencing is tiered.  Look at filter 1
        // on the prices to find the one where the qty range applies.
        for(Iterator i2 = p.getPriceCriterias().iterator(); i2.hasNext();) {
          PriceCriteria criteria = (PriceCriteria)i2.next();
          
          Integer qty1 = null;
          Integer qty2 = null;
          
          // Range check
          if (criteria.getFilter1().contains("-")) {
            String[] tokens = criteria.getFilter1().split("-");
            if (tokens.length < 2) {
              continue;
            }
            
            qty1 = Integer.valueOf(tokens[0]);
            qty2 = Integer.valueOf(tokens[1]);

            // If the qty falls within the range, this is the price that applies
            if (qty >= qty1.intValue() && qty <= qty2.intValue()) {
              price = p;
              break;
            }
          } else if (criteria.getFilter1().contains("+")) {
            // Lower limit check
            String tokens[] =  criteria.getFilter1().split("\\+");

            qty1 = Integer.valueOf(tokens[0]);
            
            if (qty >= qty1.intValue()) {
              price = p;
              break;
            }
          }
          
        }
      }
    }
    
    // Instantiate a BillingItem for the matched billing price
    if (price != null) {
      BigDecimal theUnitPrice = price.getEffectiveUnitPrice(request.getLab());
      
      BillingItem billingItem = new BillingItem();
      billingItem.setCodeBillingChargeKind(priceCategory.getCodeBillingChargeKind());
      billingItem.setIdBillingPeriod(billingPeriod.getIdBillingPeriod());
      billingItem.setDescription(price.getName());
      billingItem.setQty(qty);
      billingItem.setUnitPrice(theUnitPrice);
      billingItem.setPercentagePrice(new BigDecimal(1));        
      if (qty > 0 && theUnitPrice != null) {      
        billingItem.setInvoicePrice(theUnitPrice.multiply(new BigDecimal(qty)));
      }
      billingItem.setCodeBillingStatus(billingStatus);
      if (!billingStatus.equals(BillingStatus.NEW) && !billingStatus.equals(BillingStatus.PENDING)) {
        billingItem.setCompleteDate(new java.sql.Date(System.currentTimeMillis()));
      }
      billingItem.setIdRequest(request.getIdRequest());
      billingItem.setIdLab(request.getIdLab());
      billingItem.setIdBillingAccount(request.getIdBillingAccount());        
      billingItem.setIdPrice(price.getIdPrice());
      billingItem.setIdPriceCategory(priceCategory.getIdPriceCategory());
      billingItem.setCategory(priceCategory.getName());
      billingItem.setIdCoreFacility(request.getIdCoreFacility());
    
      
      billingItems.add(billingItem);
      
    }
    
    
    return billingItems;
  }
  
}