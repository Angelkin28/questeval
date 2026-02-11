declare module '@radix-ui/react-switch' {
    import * as React from 'react';

    export interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
        asChild?: boolean;
        defaultChecked?: boolean;
        checked?: boolean;
        onCheckedChange?(checked: boolean): void;
        disabled?: boolean;
        required?: boolean;
        name?: string;
        value?: string;
    }

    export const Root: React.ForwardRefExoticComponent<SwitchProps & React.RefAttributes<HTMLButtonElement>>;
    export const Thumb: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLSpanElement> & React.RefAttributes<HTMLSpanElement>>;
}
