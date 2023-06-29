import { View, Text } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';

import { useTheme } from '../../../../theme';
import sharedStyles from '../../../../views/Styles';
import { TAutocompleteType } from '../../interfaces';
import Avatar from '../../../Avatar';

interface IAutocompleteItem {
	id: string;
	title: string;
	subtitle: string;
	notInChannel?: boolean;
}

interface IAutocompleteItemProps {
	item: IAutocompleteItem;
	type: TAutocompleteType;
	onPress: (item: any) => void;
}

export const AutocompleteItem = ({ item, type, onPress }: IAutocompleteItemProps) => {
	const { colors } = useTheme();
	return (
		<RectButton
			onPress={() => onPress(item)}
			underlayColor={colors.buttonBackgroundPrimaryPress}
			style={{ backgroundColor: colors.surfaceLight }}
			rippleColor={colors.buttonBackgroundPrimaryPress}
		>
			<View
				style={{
					minHeight: 48,
					flexDirection: 'row',
					paddingHorizontal: 16,
					paddingVertical: 6,
					gap: 12
				}}
			>
				{type === '@' || type === '#' ? <Avatar text={item.subtitle} size={36} /> : null}
				<View style={{ flex: 1, justifyContent: 'center', gap: 2 }}>
					<View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
						<Text style={[sharedStyles.textBold, { fontSize: 14, color: colors.fontDefault }]} numberOfLines={1}>
							{item.title}
						</Text>
					</View>
					<View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
						<Text
							style={[sharedStyles.textRegular, { fontSize: 14, color: colors.fontSecondaryInfo, flex: 1 }]}
							numberOfLines={type === '!' ? 0 : 1}
						>
							{item.subtitle}
						</Text>
						{item.notInChannel ? (
							<Text style={[sharedStyles.textRegular, { fontSize: 12, color: colors.fontSecondaryInfo }]}>Not in channel</Text>
						) : null}
					</View>
				</View>
			</View>
		</RectButton>
	);
};
