import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'

import {
    AnalysisPanelComponent,
    AnalysisOverviewComponent,
    AnalysisTab,
    AnalysisVisibleTabComponent
} from './index'
import {ANALYSIS_ROUTING} from "../analysis.routes";
import {ComboBoxModule} from "../../../modules/combobox.module";
import {IconTextRendererComponent} from "../../util/grid-renderers/icon-text-renderer.component";
import {AgGridModule} from "ag-grid-angular";
import {TabsModule} from "../../util/tabs/tabs.module";
import {AngularMaterialModule} from "../../../modules/angular-material.module";



@NgModule({
    imports: [
        CommonModule,
        ANALYSIS_ROUTING,
        ComboBoxModule,
        AgGridModule.withComponents([IconTextRendererComponent]),
        TabsModule,
        AngularMaterialModule
    ],

    declarations: [
        AnalysisPanelComponent,
        AnalysisOverviewComponent,
        AnalysisTab,
        AnalysisVisibleTabComponent
    ],
    providers: [],
    entryComponents: [AnalysisTab,AnalysisVisibleTabComponent],
    exports: [AnalysisPanelComponent]
})
export class AnalysisOverviewModule { }