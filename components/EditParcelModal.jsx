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
import { Timestamp } from 'firebase/firestore';

// Função para formatar data YYYY-MM-DD (para o <TextInput type="date">, mas aqui só usamos para leitura)
function formatDate(date) {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : date; // Converte Timestamp se necessário
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}


export function EditParcelModal({ visible, parcel, onClose, onSave, styles }) {
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [date, setDate] = useState(''); // Vamos guardar como string YYYY-MM-DD

  // Popula o formulário quando a parcela selecionada muda
  useEffect(() => {
    if (parcel) {
      setDescription(parcel.debtDescription);
      setValue(parcel.value.toString());
      setDate(formatDate(parcel.paymentDate));
    }
  }, [parcel]);

  const handleSave = () => {
    const newValue = parseFloat(value);
    
    // Validação simples da data (YYYY-MM-DD)
    if (!description || !newValue || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert("Erro", "Por favor, preencha todos os campos corretamente (Data: AAAA-MM-DD).");
      return;
    }
    
    // Converte a string de data de volta para um Objeto Date
    // Adiciona T12:00:00 para evitar problemas de fuso horário
    const newDate = new Date(date + 'T12:00:00'); 
    
    onSave({
      debtDescription: description,
      value: newValue,
      paymentDate: Timestamp.fromDate(newDate)
    });
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
          <Text style={styles.modalTitle}>Editar Parcela</Text>
          
          <TextInput
            style={styles.proInput}
            placeholder="Descrição"
            value={description}
            onChangeText={setDescription}
            placeholderTextColor="#9ca3af"
          />
          <TextInput
            style={styles.proInput}
            placeholder="Valor (R$)"
            value={value}
            onChangeText={setValue}
            keyboardType="numeric"
            placeholderTextColor="#9ca3af"
          />
          <TextInput
            style={styles.proInput}
            placeholder="Data Venc. (AAAA-MM-DD)"
            value={date}
            onChangeText={setDate}
            placeholderTextColor="#9ca3af"
          />
          
          <TouchableOpacity style={[styles.proButtonPrimary, {flex: 0}]} onPress={handleSave}>
            <Text style={styles.proButtonTextPrimary}>Salvar Alterações</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.proButtonSecondary, {flex: 0}]} onPress={onClose}>
            <Text style={styles.proButtonTextSecondary}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}