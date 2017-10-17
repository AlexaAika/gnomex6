/*
 * Copyright (c) 2016 Huntsman Cancer Institute at the University of Utah, Confidential and Proprietary
 */
import {GnomexAppComponent} from "./gnomex-app.component";
import {BrowserModule} from "@angular/platform-browser";
import {NgModule} from "@angular/core";

import {APP_ROUTING} from "./gnomex-app.routes";
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {HttpModule} from "@angular/http";
import {HomeModule} from "./home/home.module";
import {BROWSE_EXPERIMENTS_ENDPOINT, VIEW_EXPERIMENT_ENDPOINT} from "./experiments/experiments.service";
import {DictionaryService} from "./services/dictionary.service";
import {DictionaryDemoModule} from "./dictionary-demo/dictionary-demo.module";
import {ExperimentsService} from "./experiments/experiments.service";
import {ExperimentsModule} from "./experiments/experiments.module";
import {NewBillingAccountModule} from "./billing/new_billing_account/new-billing-account.module";
import {RouterModule} from "@angular/router";
import {FormsModule,ReactiveFormsModule} from "@angular/forms";
import {UtilModule} from "./util/util.module";
import {DropdownModule, CollapseModule} from "ng2-bootstrap";
import {
    LOGOUT_PATH, LOGIN_PATH, SERVER_URL, LOGIN_ROUTE, DEFAULT_SUCCESS_URL,
    USER_SESSION_ENDPOINT, AUTHENTICATED_USER_ENDPOINT, ACTIVE_SESSION_ENDPOINT, UserModule, UserService
} from "@hci/user";
import {AppHeaderModule} from "@hci/app-header";
import {NavigationModule} from "@hci/navigation";
import {LocalStorageModule, LocalStorageService, ILocalStorageServiceConfig} from "angular-2-local-storage";

import "./gnomex-app.css";
//import {AppFooterModule, APP_INFO_SOURCE} from "@hci/app-footer";
import {ServicesModule} from "./services/services.module";

let localStorageServiceConfig: ILocalStorageServiceConfig = {
    prefix: "hci-ri-core",
    storageType: "localStorage"
};

/**
 * @author brandony <brandon.youkstetter@hci.utah.edu>
 * @since 8/25/16
 */
@NgModule({
    imports: [
        BrowserModule,
        APP_ROUTING,
        HttpModule,
        RouterModule,
        FormsModule,
        ReactiveFormsModule,
        HomeModule,
        UtilModule,
        DictionaryDemoModule,
        DropdownModule.forRoot(),
        CollapseModule.forRoot(),
        AppHeaderModule,
        UserModule,
        NavigationModule,
        ExperimentsModule,
        NewBillingAccountModule,
        ServicesModule,
        LocalStorageModule.withConfig(localStorageServiceConfig)
    ],
    declarations: [GnomexAppComponent],
    bootstrap: [GnomexAppComponent],
    providers: [
        {provide: BROWSE_EXPERIMENTS_ENDPOINT, useValue: "/gnomex/GetExperimentOverviewList.gx"},
        {provide: VIEW_EXPERIMENT_ENDPOINT, useValue: "/gnomex/GetRequest.gx"},
        {provide: AUTHENTICATED_USER_ENDPOINT, useValue: "/gnomex/api/user/authenticated"},
        {provide: DEFAULT_SUCCESS_URL, useValue: ""},
        {provide: USER_SESSION_ENDPOINT, useValue: "/gnomex/api/user-session"},
        {provide: ACTIVE_SESSION_ENDPOINT, useValue: "/gnomex/api/user-session/active"},
        {provide: SERVER_URL, useValue: null},
        {provide: LOGIN_PATH, useValue: null},
        {provide: LOGOUT_PATH, useValue: null},
        {provide: LOGIN_ROUTE, useValue: "/login"},
        UserService,
        ExperimentsService,
        DictionaryService,
        LocalStorageService
    ]
})
export class GnomexAppModule {o
}
