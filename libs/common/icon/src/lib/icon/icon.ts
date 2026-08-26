import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";

import { data } from "./icons.data";
import { IconStyle } from "./icons.enum";

@Component({
    selector: "lib-icon",
    imports: [CommonModule],
    template: `@if(iconPath != ''){
        <svg
            xmlns="http://www.w3.org/2000/svg"
            [class]="class"
            fill="currentColor"
            viewBox="0 0 256 256"
        >
            <path [attr.d]="iconPath"></path>
        </svg>
    }`,
    styles: ``,
})
export class IconComponent {
    @Input({ required: true }) icon!: string | { [klass: string]: any };
    @Input() iconStyle?: string;
    @Input() class?: string = "w-7";
    iconPath: string = "";

    constructor() { }
    ngOnInit(): void {
        this.setIcon();
    }

    private setIcon() {
        try {

            this.iconPath = "";
            if (this.class && this.class.indexOf("w-") < 0)
                this.class += " w-7";
            let icon: string = "";

            if (typeof this.icon === "object") {
                const values = Object.values(this.icon);
                const truthyIndex = values.indexOf(true);

                if (truthyIndex !== -1) {
                    icon = Object.keys(this.icon)[truthyIndex];
                }
            } else icon = this.icon;

            if (this.iconStyle == IconStyle.Fill) {
                this.iconPath = data[icon]["FILL"];
            } else {

                this.iconPath = data[icon]["DEFAULT"];
            }
        } catch (e) { }
    }
}
