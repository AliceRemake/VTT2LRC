// see: https://github.com/papnkukn/subsrt MIT License
const helper = {
    toMilliseconds: function (s) {
        const match = /^\s*(\d{1,2}:)?(\d{1,2}):(\d{1,2})([.,](\d{1,3}))?\s*$/.exec(s);
        const hh = match[1] ? parseInt(match[1].replace(":", "")) : 0;
        const mm = parseInt(match[2]);
        const ss = parseInt(match[3]);
        const ff = match[5] ? parseInt(match[5]) : 0;
        const ms = hh * 3600 * 1000 + mm * 60 * 1000 + ss * 1000 + ff;
        return ms;
    },
    toTimeString: function (ms) {
        const hh = Math.floor(ms / 1000 / 3600);
        const mm = Math.floor(ms / 1000 / 60 % 60);
        const ss = Math.floor(ms / 1000 % 60);
        const ff = Math.floor(ms % 1000);
        const time = (hh < 10 ? "0" : "") + hh + ":" + (mm < 10 ? "0" : "") + mm + ":" + (ss < 10 ? "0" : "") + ss + "." + (ff < 100 ? "0" : "") + (ff < 10 ? "0" : "") + ff;
        return time;
    }
};

// see: https://github.com/papnkukn/subsrt MIT License
export const parseVTT = (content, options = {}) => {
    var index = 1;
    var captions = [];
    var eol = options.eol || "\r\n";
    // see: https://github.com/papnkukn/subsrt/pull/8/commits/39df3ebc60d754168c4a396fb866fe3fa048bceb
    // var parts = content.split(/\r?\n\s+\r?\n/);
    var parts = content.split(/\r?\n\r?\n/);
    for (var i = 0; i < parts.length; i++) {
        //WebVTT data
        var regex = /^([^\r\n]+\r?\n)?((\d{1,2}:)?\d{1,2}:\d{1,2}([.,]\d{1,3})?)\s*-->\s*((\d{1,2}:)?\d{1,2}:\d{1,2}([.,]\d{1,3})?)\r?\n([\s\S]*)(\r?\n)*$/gi;
        var match = regex.exec(parts[i]);
        if (match) {
            var caption = {};
            caption.type = "caption";
            caption.index = index++;
            if (match[1]) {
                caption.cue = match[1].replace(/[\r\n]*/gi, "");
            }
            caption.start = helper.toMilliseconds(match[2]);
            caption.end = helper.toMilliseconds(match[5]);
            caption.duration = caption.end - caption.start;
            var lines = match[8].split(/\r?\n/);
            caption.content = lines.join(eol);
            caption.text = caption.content
                .replace(/<[^>]+>/g, "") //<b>bold</b> or <i>italic</i>
                .replace(/\{[^}]+\}/g, ""); //{b}bold{/b} or {i}italic{/i}
            captions.push(caption);
            continue;
        }

        //WebVTT meta
        var meta = /^([A-Z]+)(\r?\n([\s\S]*))?$/.exec(parts[i]);
        if (!meta) {
            //Try inline meta
            meta = /^([A-Z]+)\s+([^\r\n]*)?$/.exec(parts[i]);
        }
        if (meta) {
            caption = {};
            caption.type = "meta";
            caption.name = meta[1];
            if (meta[3]) {
                caption.data = meta[3];
            }
            captions.push(caption);
            continue;
        }

        if (options.verbose) {
            console.log("WARN: Unknown part", parts[i]);
        }
    }
    return captions;
};

// see: https://github.com/papnkukn/subsrt MIT License
export const buildLRC = (captions, options = {}) => {
    var content = "";
    var lyrics = false;
    var eol = options.eol || "\r\n";
    for (var i = 0; i < captions.length; i++) {
        var caption = captions[i];
        if (caption.type === "meta") {
            if (caption.tag && caption.data) {
                content += "[" + caption.tag + ":" + caption.data.replace(/[\r\n]+/g, " ") + "]" + eol;
            }
            continue;
        }

        if (typeof caption.type === "undefined" || caption.type === "caption") {
            if (!lyrics) {
                content += eol; //New line when lyrics start
                lyrics = true;
            }
            content += "[" + helper.toTimeString(caption.start) + "]" + caption.text + eol;
            continue;
        }

        if (options.verbose) {
            console.log("SKIP:", caption);
        }
    }

    return content;
};
