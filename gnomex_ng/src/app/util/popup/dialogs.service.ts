import {Injectable, TemplateRef} from '@angular/core';
import { MatDialogRef, MatDialog, MatDialogConfig } from '@angular/material';

import { Observable } from 'rxjs';

import { ConfirmDialog } from './confirm-dialog.component';
import { AlertDialogComponent } from "./alert-dialog.component";
import { YesNoDialogComponent } from "./yes-no-dialog.component";
import { SpinnerDialogComponent } from "./spinner-dialog.component";
import {CustomDialogComponent} from "./custom-dialog.component";
import {GenericContainerDialogComponent} from "./generic-container-dialog.component";
import {GDActionConfig} from "../interfaces/generic-dialog-action.model";

@Injectable()
export class DialogsService {

    private _spinnerDialogIsOpen: boolean = false;

    public spinnerDialogRefs: MatDialogRef<SpinnerDialogComponent>[] = [];

    public get spinnerDialogIsOpen(): boolean {
        return true && this._spinnerDialogIsOpen;
    }

    constructor(private dialog: MatDialog) { }

    public alert(message: string, title?: string): Observable<boolean> {
        let configuration: MatDialogConfig = new MatDialogConfig();
        configuration.maxWidth = '40em';
        configuration.minWidth = '10em';

        let dialogRef: MatDialogRef<AlertDialogComponent>;

        dialogRef = this.dialog.open(AlertDialogComponent, configuration);
        dialogRef.componentInstance.message = message;
        dialogRef.componentInstance.title = title;

        return dialogRef.afterClosed();
    }

    public confirm(title: string, message: string): Observable<boolean> {
        let configuration: MatDialogConfig = new MatDialogConfig();
        configuration.width = '30em';

        let dialogRef: MatDialogRef<ConfirmDialog>;

        dialogRef = this.dialog.open(ConfirmDialog, configuration);
        dialogRef.componentInstance.title = title;
        dialogRef.componentInstance.message = message;

        return dialogRef.afterClosed();
    }
    public createCustomDialog(tempRef:TemplateRef<any>, title?:string){

        let configuration: MatDialogConfig = new MatDialogConfig();


        if(title){
            configuration.data ={templateRef: tempRef,title:title};
        }else{
            configuration.data = {templateRef:tempRef}
        }
        configuration.maxHeight = "15em";
        let dialogRef = this.dialog.open(tempRef, configuration);
        return dialogRef.afterClosed();
    }

    public yesNoDialog(message: string|string[], parent: any, onYesFunctionName: string, onNoFunctionName?: string, title?: string): Observable<boolean> {
        let configuration: MatDialogConfig = new MatDialogConfig();
        configuration.width = '20em';

        let dialogRef: MatDialogRef<YesNoDialogComponent>;

        dialogRef = this.dialog.open(YesNoDialogComponent, configuration);
        if (Array.isArray(message)) {
            dialogRef.componentInstance.lines = message;
        } else {
            dialogRef.componentInstance.message = message;
        }
        dialogRef.componentInstance.title = title;
        dialogRef.componentInstance.parent = parent;
        dialogRef.componentInstance.onYesFunctionName = onYesFunctionName;
        dialogRef.componentInstance.onNoFunctionName = onNoFunctionName;

        return dialogRef.afterClosed();
    }

    public startDefaultSpinnerDialog(): MatDialogRef<SpinnerDialogComponent> {
        return this.startSpinnerDialog('Loading...', 3, 30);
    }

    public startSpinnerDialog(message: string, strokeWidth: number, diameter: number): MatDialogRef<SpinnerDialogComponent> {
        if (this._spinnerDialogIsOpen) {
            return null;
        }

        this._spinnerDialogIsOpen = true;

        let configuration: MatDialogConfig = new MatDialogConfig();
        configuration.data = {
            message: message,
            strokeWidth: strokeWidth,
            diameter: diameter
        };
        configuration.width = '13em';
        configuration.disableClose = true;

        let dialogRef: MatDialogRef<SpinnerDialogComponent> = this.dialog.open(SpinnerDialogComponent, configuration);

        dialogRef.afterClosed().subscribe(() => { this._spinnerDialogIsOpen = false; });

        this.spinnerDialogRefs.push(dialogRef);

        return dialogRef;
    }

    // Let there be an alternative, global way to stop all active spinner dialogs.
    public stopAllSpinnerDialogs(): void {
        for (let dialogRef of this.spinnerDialogRefs) {
            setTimeout(() => {
                dialogRef.close();
            });
        }
    }

    public genericDialogContainer(dialogContent:any,title:string,icon?:string,
                                  config?:MatDialogConfig, actionConfig?:GDActionConfig):Observable<any> {
        let configuration: MatDialogConfig = null;


        if (!config) {
            configuration = new MatDialogConfig();
        } else {
            configuration = config;
        }
        configuration.data = configuration.data ? configuration.data : {};
        configuration.data["dialogContent"] = dialogContent;
        configuration.data["title"] = title;
        if(icon){
            configuration.data["icon"] = icon;
        }
        if(actionConfig){
            configuration.data["actionConfig"] = actionConfig;
        }
        configuration.panelClass = "no-padding";
        configuration.disableClose = true;
        let dialogRef = this.dialog.open(GenericContainerDialogComponent, configuration );

        return dialogRef.afterClosed();
    }


}
