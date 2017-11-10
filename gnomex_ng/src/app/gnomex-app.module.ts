/*
 * Copyright (c) 2016 Huntsman Cancer Institute at the University of Utah, Confidential and Proprietary
 */
import {GnomexAppComponent} from "./gnomex-app.component";
import {BrowserModule} from "@angular/platform-browser";
import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {HeaderModule} from "./header/header.module";
import {APP_ROUTING} from "./gnomex-app.routes";
import {HttpModule} from "@angular/http";
import {HomeModule} from "./home/home.module";
import {BROWSE_EXPERIMENTS_ENDPOINT, VIEW_EXPERIMENT_ENDPOINT} from "./experiments/experiments.service";
import {ExperimentsService} from "./experiments/experiments.service";
import {ExperimentsModule} from "./experiments/experiments.module";
import {NewBillingAccountModule} from "./billing/new_billing_account/new-billing-account.module";
import {ProgressService} from "./home/progress.service";
import {RouterModule} from "@angular/router";
import {FormsModule} from "@angular/forms";
import {
    AUTHENTICATED_USER_ENDPOINT, UserModule, UserService
} from "@hci/user";
import {
    AuthenticationModule, AuthenticationService,
    AUTHENTICATION_LOGOUT_PATH, AUTHENTICATION_ROUTE,
    AUTHENTICATION_TOKEN_KEY, AUTHENTICATION_TOKEN_ENDPOINT, AUTHENTICATION_DIRECT_ENDPOINT, AUTHENTICATION_MAX_INACTIVITY_MINUTES
} from "@hci/authentication";
import {NavigationModule} from "@hci/navigation";
import {LocalStorageModule, LocalStorageService, ILocalStorageServiceConfig} from "angular-2-local-storage";

import "./gnomex-app.css";
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { ServicesModule } from './services/services.module';
import {AnalysisModule} from "./analysis/analysis.module";
import {MatIconModule} from "@angular/material";

let localStorageServiceConfig: ILocalStorageServiceConfig = {
    prefix: "gnomex",
    storageType: "localStorage"
};

/**
 * @since 1.0.0
 */
@NgModule({
    imports: [
        BrowserModule,
        APP_ROUTING,
        HttpModule,
        RouterModule,
        FormsModule,
        HeaderModule,
        HomeModule,
        UserModule,
        AuthenticationModule,
        NavigationModule,
        ExperimentsModule,
        NewBillingAccountModule,
        ServicesModule,
        LocalStorageModule.withConfig(localStorageServiceConfig),
        NgbModule.forRoot(),
        CommonModule,
        UserModule,
        BrowserAnimationsModule,
        AnalysisModule,
        MatIconModule,
    ],
    declarations: [GnomexAppComponent],
    bootstrap: [GnomexAppComponent],
    providers: [
        {provide: BROWSE_EXPERIMENTS_ENDPOINT, useValue: "/gnomex/GetExperimentOverviewList.gx"},
        {provide: AUTHENTICATED_USER_ENDPOINT, useValue: "/gnomex/api/user/authenticated"},
        {provide: AUTHENTICATION_DIRECT_ENDPOINT, useValue: "/gnomex/api/user-session"},
        {provide: AUTHENTICATION_TOKEN_ENDPOINT, useValue: "/gnomex/api/token"},
        {provide: AUTHENTICATION_LOGOUT_PATH, useValue: "/gnomex/logout"},
        {provide: AUTHENTICATION_ROUTE, useValue: "/authenticate"},
        {provide: AUTHENTICATION_TOKEN_KEY, useValue: "gnomex-jwt"},
        {provide: AUTHENTICATION_MAX_INACTIVITY_MINUTES, useValue: 240},
        UserService,
        AuthenticationService,
        ExperimentsService,
        ProgressService
    ]
})
export class GnomexAppModule {
}