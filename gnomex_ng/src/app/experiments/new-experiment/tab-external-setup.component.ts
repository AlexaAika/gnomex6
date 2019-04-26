import {Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from "@angular/core";
import {LabListService} from "../../services/lab-list.service";
import {UserPreferencesService} from "../../services/user-preferences.service";
import {CreateSecurityAdvisorService} from "../../services/create-security-advisor.service";
import {Subscription} from "rxjs";
import {GetLabService} from "../../services/get-lab.service";
import {ConstantsService} from "../../services/constants.service";
import {TopicService} from "../../services/topic.service";
import {OrganismService} from "../../services/organism.service";
import {UtilService} from "../../services/util.service";
import {DictionaryService} from "../../services/dictionary.service";
import {MatDialog, MatDialogConfig, MatDialogRef} from "@angular/material";
import {CreateProjectComponent} from "../create-project.component";
import {AppUserListService} from "../../services/app-user-list.service";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {Experiment} from "../../util/models/experiment.model";

@Component({
    selector: 'tab-external-setup',
    template: `
        <div class="full-height full-width flex-container-col padded">
            <lazy-loaded-select placeholder="Lab group" [options]="this.labList" class="half-width"
                                [displayField]="this.prefService.labDisplayField" [allowNone]="true"
                                [control]="this.form.get('lab')">
            </lazy-loaded-select>
            <lazy-loaded-select *ngIf="this.showUserSelection" placeholder="Submitter" [options]="this.userList" class="half-width"
                                [displayField]="this.prefService.userDisplayField" [allowNone]="true"
                                [control]="this.form.get('appUser')">
            </lazy-loaded-select>
            <div class="flex-container-row align-center">
                <lazy-loaded-select placeholder="Project folder for organizing experiments" [options]="this.projectList" class="half-width"
                                    valueField="idProject" [displayField]="'name'" [allowNone]="true"
                                    [control]="this.form.get('idProject')">
                </lazy-loaded-select>
                <div>
                    <button mat-button [disabled]="!this.form.get('idProject').value" (click)="this.editProject()">Edit</button>
                </div>
                <div>
                    <button mat-button (click)="this.newProject()">New</button>
                </div>
            </div>
            <div class="flex-container-row full-width align-center">
                <div [hidden]="!this.showLinkToTopic" class="half-width">
                    <mat-form-field class="full-width">
                        <mat-select placeholder="Topic(s)" [formControl]="this.form.get('topic')" multiple>
                            <mat-option *ngFor="let top of this.topicList" [value]="top">{{top.name}}</mat-option>
                        </mat-select>
                    </mat-form-field>
                </div>
                <div>
                    <button mat-button (click)="this.toggleShowLinkToTopic()"><img [src]="this.constantsService.ICON_TOPIC" class="icon">{{showLinkToTopic ? 'Hide' : 'Show'}} Link to Topic</button>
                </div>
            </div>
            <lazy-loaded-select placeholder="Organism" [options]="this.organismList" class="half-width"
                                [displayField]="'display'" [allowNone]="true"
                                [control]="this.form.get('organism')">
            </lazy-loaded-select>
            <div class="flex-container-row full-width align-center">
                <label class="margin-right">Experiment platform</label>
                <mat-radio-group class="flex-container-col" [formControl]="this.form.get('requestCategory')">
                    <mat-radio-button *ngFor="let reqCat of this.requestCategoryList" [value]="reqCat">
                        <div class="flex-container-row">
                            <div class="experiment-platform-label"><img [src]="reqCat.icon" class="icon">{{reqCat.display}}</div>
                            <div>{{reqCat.notes}}</div>
                        </div>
                    </mat-radio-button>
                </mat-radio-group>
            </div>
            <lazy-loaded-select placeholder="Experiment type" [options]="this.requestApplicationList" class="half-width"
                                [displayField]="'display'" [allowNone]="true"
                                [control]="this.form.get('application')">
            </lazy-loaded-select>
        </div>
    `,
    styles: [`
        .margin-right {
            margin-right: 2em;
        }
        .experiment-platform-label {
            width: 20em;
        }
    `]
})

export class TabExternalSetupComponent implements OnInit, OnChanges, OnDestroy {

    @Input() experiment: Experiment;

    public form: FormGroup;
    public labList: any[] = [];
    public showUserSelection: boolean = false;
    public userList: any[] = [];
    public projectList: any[] = [];
    public showLinkToTopic: boolean = false;
    public topicList: any[] = [];
    public organismList: any[] = [];
    public requestCategoryList: any[] = [];
    public requestApplicationList: any[] = [];

    private subscriptions: Subscription[] = [];

    constructor(public constantsService: ConstantsService,
                private securityAdvisor: CreateSecurityAdvisorService,
                private labListService: LabListService,
                private getLabService: GetLabService,
                private prefService: UserPreferencesService,
                private topicService: TopicService,
                private organismService: OrganismService,
                private dictionaryService: DictionaryService,
                private dialog: MatDialog,
                private appUserService: AppUserListService,
                private formBuilder: FormBuilder) {

        this.form = this.formBuilder.group({
            lab: ["", [Validators.required]],
            appUser: ["", [Validators.required]],
            idProject: ["", [Validators.required]],
            topic: ["", []],
            organism: ["", [Validators.required]],
            requestCategory: ["", [Validators.required]],
            application: ["", [Validators.required]],
        });
    }

    ngOnInit(): void {
        this.showUserSelection = this.securityAdvisor.isAdmin || this.securityAdvisor.isSuperAdmin;
        if (!this.showUserSelection) {
            setTimeout(() => {
                this.appUserService.getAppUserNew("" + this.securityAdvisor.idAppUser).subscribe((user: any) => {
                    this.form.get("appUser").setValue(user);
                });
            });
        }

        this.labListService.getSubmitRequestLabList().subscribe((response: any[]) => {
            this.labList = response.sort(this.prefService.createLabDisplaySortFunction());
        });
        this.organismService.getOrganismListNew().subscribe((result: any) => {
            this.organismList = UtilService.getJsonArray(result, result.Organism)
                .filter((o: any) => o.isActive === 'Y' && o.canRead === 'Y')
                .sort(this.prefService.createDisplaySortFunction("display"));
        });
        this.requestCategoryList = this.dictionaryService.getEntriesExcludeBlank(DictionaryService.REQUEST_CATEGORY)
            .filter((cat: any) => cat.isActive === 'Y' && cat.isExternal === 'Y')
            .sort(this.prefService.createDisplaySortFunction("sortOrder"));
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.experiment && this.subscriptions.length === 0) {
            this.registerSubscriptions();
        }
    }

    private registerSubscriptions(): void {
        this.subscriptions.push(this.form.get("lab").valueChanges.subscribe(() => {
            if (this.showUserSelection) {
                this.form.get("appUser").setValue("");
                this.userList = [];
                if (this.form.get("lab").value) {
                    this.getLabService.getSubmittersForLab(this.form.get("lab").value.idLab, "N", "N").subscribe((result: any[]) => {
                        this.userList = result.sort(this.prefService.createUserDisplaySortFunction());
                    });
                }
            }
            this.getLabProjects();
            this.experiment.lab = this.form.get("lab").value;
        }));

        this.subscriptions.push(this.form.get("appUser").valueChanges.subscribe(() => {
            if (this.showUserSelection) {
                this.preselectProject("idAppUser", this.form.get("appUser").value ? this.form.get("appUser").value.idAppUser : "");
            }
            this.experiment.experimentOwner = this.form.get("appUser").value;
        }));

        this.subscriptions.push(this.form.get("idProject").valueChanges.subscribe(() => {
            this.experiment.idProject = this.form.get("idProject").value;
        }));

        this.subscriptions.push(this.form.get("topic").valueChanges.subscribe(() => {
            if (this.form.get("topic").value) {
                this.experiment.topics = this.form.get("topic").value;
            } else {
                this.experiment.topics = [];
            }
        }));

        this.subscriptions.push(this.form.get("organism").valueChanges.subscribe(() => {
            this.experiment.organism = this.form.get("organism").value;
        }));

        this.subscriptions.push(this.form.get("requestCategory").valueChanges.subscribe(() => {
            let codeRequestCategory: string = this.form.get("requestCategory").value ? this.form.get("requestCategory").value.codeRequestCategory : "";
            this.form.get("application").setValue("");
            this.requestApplicationList = this.dictionaryService.getEntriesExcludeBlank(DictionaryService.REQUEST_CATEGORY_APPLICATION)
                .filter((app: any) => app.canRead === 'Y' && app.codeRequestCategory === codeRequestCategory)
                .sort(this.prefService.createDisplaySortFunction("display"));
            this.experiment.requestCategory = this.form.get("requestCategory").value;
            this.experiment.idCoreFacility = this.form.get("requestCategory").value ? this.form.get("requestCategory").value.idCoreFacility : "";
        }));

        this.subscriptions.push(this.form.get("application").valueChanges.subscribe(() => {
            this.experiment.application_object = this.form.get("application").value;
        }));
    }

    private getLabProjects(idProjectToSelect?: string): void {
        if (this.form.get("lab").value) {
            this.getLabService.getLabProjects(this.form.get("lab").value.idLab).subscribe((result: any[]) => {
                this.projectList = result.sort(this.prefService.createDisplaySortFunction("name"));
                if (idProjectToSelect) {
                    this.preselectProject("idProject", idProjectToSelect);
                } else {
                    this.preselectProject("idAppUser", this.form.get("appUser").value.idAppUser);
                }
            });
        } else {
            this.projectList = [];
            this.preselectProject();
        }
    }

    private preselectProject(attribute?: string, value?: string): void {
        let newValue: string = "";
        if (attribute && value) {
            for (let proj of this.projectList) {
                if (proj[attribute] === value) {
                    newValue = proj.idProject;
                    break;
                }
            }
        }
        this.form.get("idProject").setValue(newValue);
    }

    public editProject(): void {
        let config: MatDialogConfig = new MatDialogConfig();
        config.data = {
            idProject: this.form.get('idProject').value,
        };
        let dialogRef: MatDialogRef<CreateProjectComponent> = this.dialog.open(CreateProjectComponent, config);
        dialogRef.afterClosed().subscribe((result: any) => {
            if (result) {
                this.getLabProjects(result);
            }
        });
    }

    public newProject(): void {
        let dialogRef: MatDialogRef<CreateProjectComponent> = this.dialog.open(CreateProjectComponent);
        dialogRef.afterClosed().subscribe((result: any) => {
            if (result) {
                this.getLabProjects(result);
            }
        });
    }

    public toggleShowLinkToTopic(): void {
        this.showLinkToTopic = !this.showLinkToTopic;
        if (this.showLinkToTopic && this.topicList.length === 0) {
            this.topicService.getTopics().subscribe((result: any[]) => {
                this.topicList = result.sort(this.prefService.createDisplaySortFunction("name"));
            });
        }
        if (!this.showLinkToTopic) {
            this.form.get('topic').setValue("");
        }
    }

    ngOnDestroy(): void {
        for (let sub of this.subscriptions) {
            UtilService.safelyUnsubscribe(sub);
        }
    }

}