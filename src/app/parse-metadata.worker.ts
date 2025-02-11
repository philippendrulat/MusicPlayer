/// <reference lib="webworker" />

addEventListener('message', ({data}) => {
    postMessage('response');
});
