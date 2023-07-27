import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';

import { IAutocompleteEmoji, IAutocompleteUserRoom, TAutocompleteItem, TAutocompleteType } from '../interfaces';
import { search } from '../../../lib/methods';
import { sanitizeLikeString } from '../../../lib/database/utils';
import database from '../../../lib/database';
import { emojis } from '../../../lib/constants';
import { ICustomEmoji } from '../../../definitions';
import { Services } from '../../../lib/services';
import log from '../../../lib/methods/helpers/log';
import I18n from '../../../i18n';

const MENTIONS_COUNT_TO_DISPLAY = 4;

const getCustomEmojis = async (keyword: string): Promise<ICustomEmoji[]> => {
	const likeString = sanitizeLikeString(keyword);
	const whereClause = [];
	if (likeString) {
		whereClause.push(Q.where('name', Q.like(`${likeString}%`)));
	}
	const db = database.active;
	const customEmojisCollection = db.get('custom_emojis');
	const customEmojis = await (await customEmojisCollection.query(...whereClause).fetch())
		.slice(0, MENTIONS_COUNT_TO_DISPLAY)
		.map(emoji => ({
			name: emoji.name,
			extension: emoji.extension
		}));
	return customEmojis;
};

export const useAutocomplete = ({
	text,
	type,
	rid,
	commandParams
}: {
	text: string;
	type: TAutocompleteType;
	rid: string;
	commandParams: string;
}): TAutocompleteItem[] => {
	const [items, setItems] = useState<TAutocompleteItem[]>([]);
	useEffect(() => {
		const getAutocomplete = async () => {
			try {
				if (!type) {
					setItems([]);
				}
				if (type === '@' || type === '#') {
					const res = await search({ text, filterRooms: type === '#', filterUsers: type === '@', rid });
					const parsedRes: IAutocompleteUserRoom[] = res.map(item => ({
						// @ts-ignore
						id: type === '@' ? item._id : item.rid,
						// @ts-ignore
						title: item.fname || item.name || item.username,
						// @ts-ignore
						subtitle: item.username || item.name,
						// @ts-ignore
						outside: item.outside,
						// @ts-ignore
						t: item.t ?? 'd',
						// @ts-ignore
						status: item.status,
						// @ts-ignore
						teamMain: item.teamMain,
						type
					}));
					if (type === '@') {
						if ('all'.includes(text.toLocaleLowerCase())) {
							parsedRes.push({
								id: 'all',
								title: 'all',
								subtitle: I18n.t('Notify_all_in_this_room'),
								type,
								t: 'd'
							});
						}
						if ('here'.includes(text.toLocaleLowerCase())) {
							parsedRes.push({
								id: 'here',
								title: 'here',
								subtitle: I18n.t('Notify_active_in_this_room'),
								type,
								t: 'd'
							});
						}
					}
					setItems(parsedRes);
				}
				if (type === ':') {
					const customEmojis = await getCustomEmojis(text);
					const filteredStandardEmojis = emojis.filter(emoji => emoji.indexOf(text) !== -1).slice(0, MENTIONS_COUNT_TO_DISPLAY);
					let mergedEmojis: IAutocompleteEmoji[] = customEmojis.map(emoji => ({
						id: emoji.name,
						emoji,
						type
					}));
					mergedEmojis = mergedEmojis.concat(
						filteredStandardEmojis.map(emoji => ({
							id: emoji,
							emoji,
							type
						}))
					);
					setItems(mergedEmojis);
				}
				if (type === '/') {
					const db = database.active;
					const commandsCollection = db.get('slash_commands');
					const likeString = sanitizeLikeString(text);
					const commands = await (
						await commandsCollection.query(Q.where('id', Q.like(`${likeString}%`))).fetch()
					).map(command => ({
						id: command.id,
						title: command.id,
						subtitle: command.description,
						type
					}));
					setItems(commands);
				}
				if (type === '/preview') {
					const response = await Services.getCommandPreview(text, rid, commandParams);
					if (response.success) {
						const previewItems = (response.preview?.items || []).map(item => ({
							id: item.id,
							preview: item,
							type
						}));
						setItems(previewItems);
					}
				}
				if (type === '!') {
					const res = await Services.getListCannedResponse({ text });
					if (res.success) {
						const cannedResponses = res.cannedResponses.map(cannedResponse => ({
							id: cannedResponse._id,
							title: cannedResponse.shortcut,
							subtitle: cannedResponse.text,
							type
						}));
						setItems(cannedResponses);
					}
				}
			} catch (e) {
				log(e);
			}
		};
		getAutocomplete();
	}, [text, type, rid, commandParams]);
	return items;
};
