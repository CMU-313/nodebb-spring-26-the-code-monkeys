'use strict';

const api = require('../api');

const SocketOHQueue = module.exports;

SocketOHQueue.join = async function (socket, data) {
	return await api.ohqueue.join(socket, data);
};

SocketOHQueue.leave = async function (socket, data) {
	return await api.ohqueue.leave(socket, data);
};

SocketOHQueue.assign = async function (socket, data) {
	return await api.ohqueue.assign(socket, data);
};

SocketOHQueue.resolve = async function (socket, data) {
	return await api.ohqueue.resolve(socket, data);
};

SocketOHQueue.getQueue = async function (socket, data) {
	return await api.ohqueue.getQueue(socket, data);
};

SocketOHQueue.getPosition = async function (socket, data) {
	return await api.ohqueue.getPosition(socket, data);
};

SocketOHQueue.setQueueOpen = async function (socket, data) {
	return await api.ohqueue.setQueueOpen(socket, data);
};

require('../promisify')(SocketOHQueue);
