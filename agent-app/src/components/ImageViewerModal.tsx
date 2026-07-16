import { Modal, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

type Props = {
  uri: string | null;
  onClose: () => void;
};

export default function ImageViewerModal({ uri, onClose }: Props) {
  return (
    <Modal visible={!!uri} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {uri && (
          <Image source={{ uri }} style={styles.image} contentFit="contain" />
        )}
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: '100%', height: '80%' },
});
