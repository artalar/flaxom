import { useAction, useAtom } from "@reatom/npm-react";
import { ChangeEvent, HTMLInputTypeAttribute, useCallback } from "react";
import { FieldValidation, FieldAtom } from "../src";

type UseFormFieldReturn<State, Value = State> = FieldValidation & {
	getInputProps: () => {
		value: string;
		onBlur: () => void;
		onFocus: () => void;
		onChange: (evOrVal: ChangeEvent<{ value: Value; } | { checked: Value; }> | Value) => void;
	};
};

export function useFormField(model: FieldAtom<boolean>, type: 'checkbox'): UseFormFieldReturn<boolean>;
export function useFormField<State, Value>(
	model: FieldAtom<State, Value>, type?: Exclude<'checkbox', string>): UseFormFieldReturn<State, Value>;

export function useFormField<State, Value>(model: FieldAtom<State, Value>, type: HTMLInputTypeAttribute = 'text') {
	const change = useAction(model.change);
	const focus = useAction(model.focus.in);
	const blur = useAction(model.focus.out);
	const [validation] = useAtom(model.validation);
	const [value] = useAtom(model.value);

	const onBlur = useCallback(() => blur(), [blur]);
	const onFocus = useCallback(() => focus(), [focus]);
	const onChange = useCallback((evOrVal: ChangeEvent<{ value: Value; } | { checked: Value; }> | Value) => {
		if (evOrVal && typeof evOrVal === 'object' && 'target' in evOrVal) {
			if (type === 'checkbox' && 'checked' in evOrVal.target)
				change(evOrVal.target.checked);
			else if ('value' in evOrVal.target)
				change(evOrVal.target.value);
		}
		else {
			change(evOrVal);
		}
	}, [change, type]);

	const getInputProps = useCallback(() => ({
		value: String(value),
		onChange,
		onBlur,
		onFocus,
	}), [onChange, onBlur, onFocus, value]);

	return {
		getInputProps,
		...validation,
	};
}
