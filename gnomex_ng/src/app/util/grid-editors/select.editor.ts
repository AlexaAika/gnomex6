import {Component, Input, OnDestroy} from "@angular/core";

import { ICellEditorAngularComp } from "ag-grid-angular";

@Component({
	templateUrl: "./select.editor.html",
	styles: [`
      .full-width  { width:  100%; } 
			.full-height { height: 100%; }
			
			.flex-column-container {
					display: flex;
					flex-direction: row;
			}
			.flex-row  {
					display: flex;
			}
			.flex-stretch { 
					display:flex; 
					flex: 1; 
			}
	`]
}) export class SelectEditor implements ICellEditorAngularComp, OnDestroy {
	private params: any;
	value: any;
	options: any;
	optionsValueField: string;
	optionsDisplayField: string;
	gridValueField: string;

    showFillButton: boolean;		// This represents whether the editor should show the "Fill" button,
	                                // which is used to copy the value of this cell to other cells in this column in the grid
    fillGroupAttribute: string;		// This attribute is used to specify which "Group" a particular
	                                // row belongs to, which is used when the fill button is active.
	                                // When clicked, the fill button will copy the data in that cell
	                                // to the corresponding cells in rows of the same group.

	agInit(params: any): void {
		this.params = params;
		this.options = [];
		this.optionsValueField = "";
		this.optionsDisplayField = "";

		if (this.params && this.params.column && this.params.column.colDef) {
			this.gridValueField = this.params.column.colDef.field;

			this.options             = this.params.column.colDef.selectOptions;
			this.optionsValueField   = this.params.column.colDef.selectOptionsValueField;
			this.optionsDisplayField = this.params.column.colDef.selectOptionsDisplayField;

            this.fillGroupAttribute = this.params.column.colDef.fillGroupAttribute;

			this.showFillButton = this.params.column.colDef.showFillButton && ("" + this.params.column.colDef.showFillButton).toLowerCase() !== "false";
		}

		if (this.params) {
			this.value = "" + this.params.value;
		}

		if (this.showFillButton && (!this.fillGroupAttribute || this.fillGroupAttribute === '')) {
			throw new Error('Invalid state, cannot use fill button without specifying the fillGroupAttribute.');
		}
	}

	ngOnDestroy(): void {
        if (this.params && this.params.node && this.params.node[(this.gridValueField + "_originalValue")]) {
            this.value = this.params.node[(this.gridValueField + "_originalValue")];
        }
	}

	onChange(event: any): void {
		if (event && event.currentTarget) {

			if (this.params && this.params.node && !this.params.node[(this.gridValueField + "_originalValue")]) {
                this.params.node[(this.gridValueField + "_originalValue")] = this.value;
			}

			// This looks unnecessary, since this.value is linked to the value of the select component, but
			// because this also ends editing, it also queues the destruction of this component and the call to getValue.
			// The problem was that this.value isn't updated with the new value before this event fires,
			// so we need to update it manually here.
			this.value = event.currentTarget.value;
		}
		if (this.params) {

			//  If the fill button, which is part of the editor, is activated, don't stop editing immediately after making a selection.
			if (!this.showFillButton) {
				this.params.stopEditing();
			}
		}
	}

	getValue(): any {
		return this.value;
	}

	isPopup(): boolean {
		return false;
	}

	onFillButtonClicked(): void {
        console.log("Fill button clicked!");

        if (!this.fillGroupAttribute || this.fillGroupAttribute === '') {
        	throw new Error('No column attribute "fillGroupAttribute" specified. This is required to use the Fill functionality.');
		}

		if (this.params && this.params.column && this.params.column.gridApi && this.params.node && this.fillGroupAttribute && this.fillGroupAttribute !== '') {
            // if (this.params.column.gridApi.getRenderedNodes() && Array.isArray(this.params.column.gridApi.getRenderedNodes())) {
            // 	console.log("  Number of nodes : " + this.params.column.gridApi.getRenderedNodes().length);
            // }

			let temp = this.params.column.gridApi.getRenderedNodes();
			let thisRowNode = this.params.node;

			for (let node of temp) {
				if (node && node.data && thisRowNode && thisRowNode.data
					&& node.data[this.fillGroupAttribute] === thisRowNode.data[this.fillGroupAttribute]) {
					node.data[this.gridValueField] = this.value;
				}
			}

			this.params.column.gridApi.refreshCells();
		}
	}
}