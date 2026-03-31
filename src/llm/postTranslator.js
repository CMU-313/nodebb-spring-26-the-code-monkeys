'use strict';

const db = require('./../database');
const posts = require('./../posts');

const DEFAULT_LANGUAGE = 'en';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434/api/chat';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:8b';

const allowedLanguages = new Set([
	'en',
	'es',
	'fr',
	'de',
	'it',
	'pt',
	'zh',
	'ja',
	'ko',
	'ar',
	'ru',
	'hi',
]);

function sanitizeLanguage(language) {
	if (typeof language !== 'string') {
		return DEFAULT_LANGUAGE;
	}

	const normalized = language.trim().toLowerCase();

	if (!allowedLanguages.has(normalized)) {
		return DEFAULT_LANGUAGE;
	}

	return normalized;
}

function tryParseJson(content) {
	if (typeof content !== 'string' || !content.trim()) {
		return null;
	}

	try {
		return JSON.parse(content);
	} catch (err) {
		const match = content.match(/\{[\s\S]*\}/);
		if (!match) {
			return null;
		}

		try {
			return JSON.parse(match[0]);
		} catch (err2) {
			return null;
		}
	}
}

async function queryOllama(text, targetLanguage) {
	const prompt = [
		'You are a language classification and translation assistant.',
		`Analyze the user text and determine whether it is already in the target language: ${targetLanguage}.`,
		'Return ONLY valid JSON with exactly these keys:',
		'{"is_target_language": boolean, "detected_language": string, "translation": string}',
		'If the text is already in the target language, set "is_target_language" to true and return the original text in "translation".',
		'Otherwise translate the text into the target language.',
		'Do not include markdown. Do not include explanation.',
	].join(' ');

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 8000);

	try {
		const response = await fetch(OLLAMA_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model: OLLAMA_MODEL,
				stream: false,
				format: 'json',
				messages: [
					{
						role: 'system',
						content: prompt,
					},
					{
						role: 'user',
						content: text,
					},
				],
			}),
			signal: controller.signal,
		});

		clearTimeout(timeout);

		if (!response.ok) {
			return { ok: false };
		}

		const data = await response.json();
		const content = data && data.message && typeof data.message.content === 'string'
			? data.message.content.trim()
			: '';
		const parsed = tryParseJson(content);

		if (!parsed) {
			return { ok: false };
		}

		let isTargetLanguage = parsed.is_target_language;
		let detectedLanguage = parsed.detected_language;
		let translation = parsed.translation;

		if (typeof isTargetLanguage !== 'boolean') {
			isTargetLanguage = String(isTargetLanguage).toLowerCase() === 'true';
		}

		if (typeof detectedLanguage !== 'string') {
			detectedLanguage = '';
		}

		if (typeof translation !== 'string') {
			translation = String(translation || '');
		}

		if (!translation.length) {
			return { ok: false };
		}

		return {
			ok: true,
			isTargetLanguage,
			detectedLanguage,
			translation,
		};
	} catch (err) {
		clearTimeout(timeout);
		return { ok: false };
	}
}

async function translatePost(pid, targetLanguage) {
	const normalizedLanguage = sanitizeLanguage(targetLanguage);
	const cacheKey = `translator:cache:${pid}:${normalizedLanguage}`;

	const cached = await db.getObject(cacheKey);
	if (cached && typeof cached.translation === 'string' && cached.translation.length) {
		return {
			ok: true,
			translated: true,
			fromCache: true,
			targetLanguage: normalizedLanguage,
			detectedLanguage: cached.detectedLanguage || '',
			translation: cached.translation,
		};
	}

	const postData = await posts.getPostFields(pid, ['pid', 'content']);
	const rawContent = typeof postData.content === 'string' ? postData.content.trim() : '';

	if (!rawContent) {
		return {
			ok: false,
			error: 'empty-post',
		};
	}

	const llmResult = await queryOllama(rawContent, normalizedLanguage);

	if (!llmResult.ok) {
		return {
			ok: false,
			error: 'translation-failed',
		};
	}

	if (llmResult.isTargetLanguage) {
		return {
			ok: true,
			translated: false,
			fromCache: false,
			targetLanguage: normalizedLanguage,
			detectedLanguage: llmResult.detectedLanguage || '',
			translation: rawContent,
		};
	}

	await db.setObject(cacheKey, {
		translation: llmResult.translation,
		detectedLanguage: llmResult.detectedLanguage || '',
		updatedAt: Date.now(),
	});

	return {
		ok: true,
		translated: true,
		fromCache: false,
		targetLanguage: normalizedLanguage,
		detectedLanguage: llmResult.detectedLanguage || '',
		translation: llmResult.translation,
	};
}

module.exports = {
	sanitizeLanguage,
	queryOllama,
	translatePost,
};