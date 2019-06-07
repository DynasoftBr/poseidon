class CommandPipeline {
    constructor(arr) {
        this.handlers = [...arr, async () => { return; }].map((h, i) => req => h(req, this.handlers[i + 1]));
    }

    async handle(request) {
        this.handlers[0](request);
    }
}
const handler1 = async (request, next) => { console.log("teste"); next(request); };
const handler2 = async (request, next) => { console.log("teste2"); next(request); };
const handler3 = async (request, next) => { console.log("teste3"); next(request); };
const handler4 = async (request, next) => { console.log("teste4"); next(request); };

function teste(foo) {
    console.log(foo);
}

const handlers = [handler1, handler2, handler3, handler4];
const pipe = new CommandPipeline(handlers);

pipe.handle({});
// teste(handlers);