import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons'; // Importa os ícones

export function EditGroupModal({ visible, parcel, onClose, onSave, styles }) {
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (parcel) {
      setDescription(parcel.debtDescription);
    }
  }, [parcel]);

  const handleSave = () => {
    if (!description) {
      Alert.alert("Erro", "A descrição não pode estar vazia.");
      return;
    }
    onSave(description);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.modalBackdrop}
      >
        <View style={styles.modalView}>
          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
            <Feather name="x" size={24} color="#64748b" />
          </TouchableOpacity>

          <Text style={styles.modalTitle}>Editar Dívida Inteira</Text>
          <Text style={styles.modalText}>
            A nova descrição será aplicada a esta e a todas as parcelas futuras (não pagas) desta dívida.
          </Text>
          
          <TextInput
            style={styles.proInput}
            placeholder="Nova Descrição"
            value={description}
            onChangeText={setDescription}
            placeholderTextColor="#9ca3af"
          />
          
          <TouchableOpacity style={[styles.proButtonPrimary, {flex: 0}]} onPress={handleSave}>
            <Text style={styles.proButtonTextPrimary}>Salvar em Lote</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.proButtonSecondary, {flex: 0, marginBottom: 0}]} onPress={onClose}>
            <Text style={styles.proButtonTextSecondary}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}