use gnomex;

-- Remove both foreign keys that reference DNAPrepType and RNAPrepType tables from the Request Table.
alter table Request drop
       FOREIGN KEY FK_Request_DNAPrepType;
     
alter table Request drop
    FOREIGN KEY FK_Request_RNAPrepType;
       
-- Remove dna and rna code prep type columns from Request
alter table Request Drop column codeDNAPrepType;
call ExecuteIfTableExists('gnomex','Request_Audit','alter table Request_Audit DROP COLUMN codeDNAPrepType');

alter table Request Drop column codeRNAPrepType;
call ExecuteIfTableExists('gnomex','Request_Audit','alter table Request_Audit DROP COLUMN codeRNAPrepType');

-- Add new view_limit properties
INSERT INTO PropertyDictionary (propertyName, propertyValue, propertyDescription, forServerOnly)
VALUES ('view_limit_analyses', '100000', 'The maximum number of analyses returned from the back-end.', 'N');
 
INSERT INTO PropertyDictionary (propertyName, propertyValue, propertyDescription, forServerOnly)
VALUES ('view_limit_datatracks', '200000', 'The maximum number of data tracks returned from the back-end.', 'N');

INSERT INTO PropertyDictionary (propertyName, propertyValue, propertyDescription, forServerOnly)
VALUES ('view_limit_chromatograms', '1000', 'The maximum number of chromatograms returned from the back-end.', 'N');
 
INSERT INTO PropertyDictionary (propertyName, propertyValue, propertyDescription, forServerOnly)
VALUES ('view_limit_experiments', '100000', 'The maximum number of experiments returned from the back-end.', 'N');
 
INSERT INTO PropertyDictionary (propertyName, propertyValue, propertyDescription, forServerOnly)
VALUES ('view_limit_plates_and_runs', '200', 'The maximum number of plates and runs returned from the back-end.', 'N');

-- Remove out-dated view_limit properties
DELETE FROM PropertyDictionary WHERE propertyName = 'analysis_view_limit';

DELETE FROM PropertyDictionary WHERE propertyName = 'datatrack_view_limit';

DELETE FROM PropertyDictionary WHERE propertyName = 'chromatogram_view_limit';

DELETE FROM PropertyDictionary WHERE propertyName = 'experiment_view_limit';

DELETE FROM PropertyDictionary WHERE propertyName = 'plate_and_run_view_limit';

-- Add product_sheet_name property
INSERT INTO PropertyDictionary (propertyName, propertyValue, propertyDescription, forServerOnly)
VALUES ('product_sheet_name', 'Product Purchasing', 'The name of the price sheet for products.', 'N');

-- Add request_props_on_confirm_tab property
insert into PropertyDictionary (propertyName, propertyValue, propertyDescription, forServerOnly, idCoreFacility, codeRequestCategory)
    VALUES ('request_props_on_confirm_tab', 'Y', 'Show the request properties box on the confirm tab', 'N', NULL, NULL);

-- Move BillingItem from ProductLineItem to ProductOrder --
-- Drop foreign key idProductLineItem from BillingItem
ALTER TABLE BillingItem DROP FOREIGN KEY FK_BillingItem_ProductLineItem;

-- Change idProductLineItem to idProduct Order on BillingItem
ALTER TABLE BillingItem change column idProductLineItem idProductOrder INT(10) NULL;
call ExecuteIfTableExists('gnomex','BillingItem_Audit','alter table BillingItem_Audit CHANGE COLUMN idProductLineItem idProductOrder INT(10) NULL');

-- Script to update idProductLineItem to idProduct Order on existing BillingItems
update BillingItem, ProductLineItem
set BillingItem.idProductOrder = ProductLineItem.idProductOrder 
where BillingItem.idProductOrder is not null
  and BillingItem.idProductOrder = ProductLineItem.idProductLineItem;

-- Add foreign key idProductOrder to BillingItem
ALTER TABLE BillingItem ADD CONSTRAINT `FK_BillingItem_ProductOrder` FOREIGN KEY `FK_BillingItem_ProductOrder` (`idProductOrder`)
    REFERENCES `gnomex`.`ProductOrder` (`idProductOrder`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION;
	
	
-- Add base file path and qualified file path to the Product Order File table	
alter table ProductOrderFile
ADD column baseFilePath varchar(300) NULL;

alter table ProductOrderFile
ADD column qualifiedFilePath varchar(300) NULL;

call ExecuteIfTableExists('gnomex','ProductOrderFile_Audit','alter table ProductOrderFile_Audit ADD COLUMN baseFilePath varchar(300) NULL');
call ExecuteIfTableExists('gnomex','ProductOrderFile_Audit','alter table ProductOrderFile_Audit ADD COLUMN qualifiedFilePath varchar(300) NULL');

-- Add sort order to bioanalyzer chip type
alter table BioanalyzerChipType
ADD column sortOrder int DEFAULT NULL;

call ExecuteIfTableExists('gnomex','BioanalyzerChipType_Audit','alter table BioanalyzerChipType_Audit ADD COLUMN sortOrder int NULL');


-- update TransferLog table with product order stuff
	alter table TransferLog
	add column idProductOrder int default null;
	
	ALTER TABLE TransferLog ADD CONSTRAINT `FK_TransferLog_ProductOrder` FOREIGN KEY `FK_TransferLog_ProductOrder` (`idProductOrder`)
    REFERENCES `gnomex`.`ProductOrder` (`idProductOrder`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION;
    
    