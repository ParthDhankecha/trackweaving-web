const PANNA_OPTIONS: { value: number, label: string }[] = [
    { value: 1, label: '1 (single)' },
    { value: 2, label: '2 (double)' },
    { value: 3, label: '3 (triple)' },
];
const PANNA_LABEL_MAP: Record<string, string> = PANNA_OPTIONS.reduce((acc, opt) => {
    acc[`${opt.value}`] = opt.label;
    return acc;
}, {} as Record<string, string>);


export { PANNA_OPTIONS, PANNA_LABEL_MAP };