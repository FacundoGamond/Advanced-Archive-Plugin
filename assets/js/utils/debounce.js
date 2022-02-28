class Debounce {
    constructor({
        input,
        time,
        doneFunction
    }) {
        this.input = input;
        this.time = time ? time : 500;
        this.done = doneFunction;
        this.executeOnDebounce = function (callback) {
            callback(this.input.value);
        }
        this.init();
    }

    init() {
        //setup before functions
        let typingTimer; //timer identifier
        const doneTypingInterval = this.time; //time in ms, 5 second for example
        const $input = this.input;

        //on keyup, start the countdown
        $input.addEventListener('keyup', function () {
            clearTimeout(typingTimer);
            typingTimer = setTimeout(doneTyping, doneTypingInterval);
        });

        //on keydown, clear the countdown 
        $input.addEventListener('keydown', function () {
            clearTimeout(typingTimer);
        });

        //user is "finished typing," do something
        const self = this;
        function doneTyping() {
            self.executeOnDebounce(self.done)
        }
    }
}

export default Debounce;