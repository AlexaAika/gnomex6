package hci.gnomex.model;

import hci.dictionary.model.DictionaryEntry;

import java.io.Serializable;



public class Step extends DictionaryEntry implements Serializable {
    public static final String   QUALITY_CONTROL_STEP       = "QC";
    public static final String   LABELING_STEP              = "LABEL";
    public static final String   HYB_STEP                   = "HYB";
    public static final String   SCAN_EXTRACTION_STEP       = "EXT";

    public static final String   SEQ_QC                     = "SEQQC";
    public static final String   SEQ_PREP                   = "SEQPREP";
    public static final String   SEQ_PREP_QC                = "SEQPREPQC";
    public static final String   SEQ_FLOWCELL_STOCK         = "SEQSTOCK";
    public static final String   SEQ_CLUSTER_GEN            = "SEQASSEM";
    public static final String   SEQ_RUN                    = "SEQRUN";
    public static final String   SEQ_DATA_PIPELINE          = "SEQPIPE";

    public static final String   ILLSEQ_QC                  = "ILLSEQQC";
    public static final String   ILLSEQ_PREP                = "ILLSEQPREP";
    public static final String   ILLSEQ_PREP_QC             = "ILLSEQPREPQC";
    public static final String   ILLSEQ_CLUSTER_GEN         = "ILLSEQASSEM";
    public static final String   ILLSEQ_FINALIZE_FC		      = "ILLSEQFINFC";
    public static final String   ILLSEQ_RUN                 = "ILLSEQRUN";
    public static final String   ILLSEQ_DATA_PIPELINE       = "ILLSEQPIPE";

    public static final String   NOSEQ_QC                   = "NOSEQQC";
    public static final String   NOSEQ_PREP                 = "NOSEQPREP";
    public static final String   NOSEQ_PREP_QC              = "NOSEQPREPQC";
    public static final String   NOSEQ_CLUSTER_GEN          = "NOSEQASSEM";
    public static final String   NOSEQ_FINALIZE_FC		      = "NOSEQFINFC";
    public static final String   NOSEQ_RUN                  = "NOSEQRUN";
    public static final String   NOSEQ_DATA_PIPELINE        = "NOSEQPIPE";



    public static final String   HISEQ_QC                   = "HSEQQC";
    public static final String   HISEQ_PREP                 = "HSEQPREP";
    public static final String   HISEQ_PREP_QC              = "HSEQPREPQC";
    public static final String   HISEQ_CLUSTER_GEN          = "HSEQASSEM";
    public static final String   HISEQ_FINALIZE_FC          = "HSEQFINFC";
    public static final String   HISEQ_RUN                  = "HSEQRUN";
    public static final String   HISEQ_DATA_PIPELINE        = "HSEQPIPE";

    public static final String   MISEQ_QC                   = "MISEQQC";
    public static final String   MISEQ_PREP                 = "MISEQPREP";
    public static final String   MISEQ_PREP_QC              = "MISEQPREPQC";
    public static final String   MISEQ_CLUSTER_GEN          = "MISEQASSEM";
    public static final String   MISEQ_FINALIZE_FC	        = "MISEQFINFC";
    public static final String   MISEQ_RUN                  = "MISEQRUN";
    public static final String   MISEQ_DATA_PIPELINE        = "MISEQPIPE";

    public static final String   ALL_PREP                   = "ALLPREP";
    public static final String   ALL_PREP_QC                = "ALLPREPQC";
    public static final String   ALL_CLUSTER_GEN            = "ALLASSEM";
    public static final String   ALL_DATA_PIPELINE          = "ALLPIPE";


    private String codeStep;
    private String step;
    private String isActive;
    private Integer sortOrder;

    public String getDisplay() {
        String display = this.getNonNullString(getStep());
        return display;
    }

    public String getValue() {
        return getCodeStep();
    }


    public String getCodeStep() {
        return codeStep;
    }


    public void setCodeStep(String codeStep) {
        this.codeStep = codeStep;
    }


    public String getStep() {
        return step;
    }


    public void setStep(String step) {
        this.step = step;
    }


    public String getIsActive() {
        return isActive;
    }


    public void setIsActive(String isActive) {
        this.isActive = isActive;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }

}
