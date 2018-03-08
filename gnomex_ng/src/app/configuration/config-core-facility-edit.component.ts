
import {AfterViewInit, Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild} from "@angular/core";
import {FormGroup,FormBuilder,Validators } from "@angular/forms"
import {ActivatedRoute} from "@angular/router";
import {URLSearchParams} from "@angular/http";
import {jqxEditorComponent} from "../../assets/jqwidgets-ts/angular_jqxeditor";
import {CreateSecurityAdvisorService} from "../services/create-security-advisor.service";
import {PrimaryTab} from "../util/tabs/primary-tab.component";
import {ConfigurationService} from "../services/configuration.service";
import {GnomexStringUtilService} from "../services/gnomex-string-util.service";
import {Subscription} from "rxjs/Subscription";
import {DictionaryService} from "../services/dictionary.service";




@Component({
    selector: 'core-facility-edit',
    templateUrl:'./config-core-facility-edit.component.html',
    styles: [`
        .item{
            margin-right: 1em;
            flex: 1 1 0;
        }
    `]
})
export class ConfigCoreFacilityEditComponent extends PrimaryTab implements OnInit, OnDestroy{
    //Override
    public showSpinner:boolean = false;
    public readonly tbarSettings :string  ="bold italic underline | left center right |  format font size | color | ul ol | outdent indent";
    private toolBarSettings:string;
    private coreFacilityForm: FormGroup;
    private idCoreFacility:string = "";
    private coreListSubscription: Subscription;
    private coreFacilitySubscription: Subscription;
    private saveCoreFacilitySubscription : Subscription = new Subscription();

    @ViewChild('editorReference') myEditor: jqxEditorComponent;
    @Output() refreshedCore = new EventEmitter<any>();




    constructor(protected fb: FormBuilder,
                private route: ActivatedRoute,
                private secAdvisor: CreateSecurityAdvisorService,
                private configService:ConfigurationService,
                private strUtilService: GnomexStringUtilService,
                private dictionaryService: DictionaryService
    ){
        super(fb);
    }


    ngOnInit():void{ // Note this hook runs once if route changes to another folder you don't recreate component
        if(this.secAdvisor.isGuest){
            this.toolBarSettings = '';
        }else{
            this.toolBarSettings = this.tbarSettings;
        }

        this.coreFacilityForm =  this.fb.group({
            contactName:['', [ Validators.required, Validators.maxLength(100)]],
            contactEmail:['', [ Validators.email, Validators.maxLength(100)]],
            contactPhone:['',Validators.maxLength(20)],
            contactRoom:['',Validators.maxLength(200)],
            facilityName:['',Validators.maxLength(100)],
            labRoom:['',Validators.maxLength(200)],
            labPhone:['',Validators.maxLength(20)],
            contactImage:[{value:'',disabled:!this.secAdvisor.isSuperAdmin}],
            shortDescription:['',Validators.maxLength(1000)],
            isActive:[false],
            acceptOnlineWorkAuth:[false],
            showProjectAnnotations:[false]


        });

        this.coreListSubscription = this.configService.getCoreListObservable().subscribe(core =>{
            if(core.idCoreFacility ){ // existing
                this.idCoreFacility = core.idCoreFacility;
                this.coreFacilityForm.get("contactName").setValue(core.contactName);
                this.coreFacilityForm.get("contactEmail").setValue(core.contactEmail);
                this.coreFacilityForm.get("contactPhone").setValue(core.contactPhone);
                this.coreFacilityForm.get("contactRoom").setValue(core.contactRoom);
                this.coreFacilityForm.get("facilityName").setValue(core.facilityName);
                this.coreFacilityForm.get("labRoom").setValue(core.labRoom);
                this.coreFacilityForm.get("labPhone").setValue(core.labPhone);
                this.coreFacilityForm.get("contactImage").setValue(core.contactImage);
                this.coreFacilityForm.get("shortDescription").setValue(core.shortDescription);
                this.coreFacilityForm.get("isActive").setValue(core.isActive  === 'Y' ? true : false);
                this.coreFacilityForm.get("acceptOnlineWorkAuth").setValue(core.acceptOnlineWorkAuth === 'Y' ? true : false);
                this.coreFacilityForm.get("showProjectAnnotations").setValue(core.showProjectAnnotations === 'Y' ? true : false);
                this.coreFacilityForm.markAsPristine();
            }else{
                this.idCoreFacility = "";
                this.coreFacilityForm.reset();
                this.coreFacilityForm.markAsPristine();
            }
        });
    }


    ngAfterViewInit(){
        this.coreFacilitySubscription = this.configService.getCoreListObservable().subscribe(core =>{
            if(core.contactName != null && core.contactName != undefined ){ // empty string is valid so have do this the longer way
                this.myEditor.val(core.description);
            }else{
                this.myEditor.val('');
            }
        });
    }

    changed(event:any){
        this.coreFacilityForm.markAsDirty();
    }


    save():void{
        this.showSpinner = true;
        let params:URLSearchParams = new URLSearchParams();
        params.set('idCoreFacility', this.idCoreFacility);
        params.set('contactName', this.coreFacilityForm.get("contactName").value );
        params.set('contactEmail', this.coreFacilityForm.get("contactEmail").value);
        params.set('contactPhone', this.coreFacilityForm.get("contactPhone").value);
        params.set('contactRoom',this.coreFacilityForm.get("contactRoom").value);
        params.set('facilityName', this.coreFacilityForm.get("facilityName").value);
        params.set('labRoom', this.coreFacilityForm.get("labRoom").value);
        params.set('labPhone', this.coreFacilityForm.get("labPhone").value);
        params.set('contactImage', this.coreFacilityForm.get("contactImage").value);
        params.set('shortDescription', this.coreFacilityForm.get("shortDescription").value);
        params.set('description', GnomexStringUtilService.cleanRichTextHTML(this.myEditor.val()));
        params.set('isActive', this.coreFacilityForm.get("isActive").value ? 'Y' : 'N');
        params.set('acceptOnlineWorkAuth', this.coreFacilityForm.get("acceptOnlineWorkAuth").value ? 'Y': 'N');
        params.set('showProjectAnnotations', this.coreFacilityForm.get("showProjectAnnotations").value ? 'Y':'N');

        this.saveCoreFacilitySubscription = this.configService.saveCoreFacility(params).subscribe(resp => {
            this.showSpinner = false;
            this.coreFacilityForm.markAsPristine();
            this.dictionaryService.reload(() =>{
                this.idCoreFacility = resp.idCoreFacility;
               this.refreshedCore.emit({
                   'facilityName':this.coreFacilityForm.get("facilityName").value,
                   'idCoreFacility':resp.idCoreFacility
               });
            });
        })
    }


    ngOnDestroy(){
        this.coreListSubscription.unsubscribe();
        this.coreFacilitySubscription.unsubscribe();
        this.saveCoreFacilitySubscription.unsubscribe();
        this.refreshedCore.unsubscribe();
    }

}




