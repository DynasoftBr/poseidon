const SysUsers = {
    root: "root",
};

type SysUsers = (typeof SysUsers)[keyof typeof SysUsers];

export { SysUsers };