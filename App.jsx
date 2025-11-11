// App.jsx FINAL
import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- Importar a biblioteca LUCIDE ---
import {
  LogOut, ChevronLeft, ChevronRight, Settings, Plus, Check, Edit, Trash2, X, Layers,
  Tag, Utensils, Home, Car, ShoppingCart, HeartPulse, GraduationCap,
  Bus, Shirt, Film, Plane, Gift, PawPrint, Dumbbell, Briefcase,
  Smartphone, Landmark, Receipt, Wrench, Pizza, Filter,
  AlertCircle 
} from 'lucide-react-native';

// Importações do Firebase (SDK v9)
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  writeBatch,
  Timestamp,
  query,
  where,
  onSnapshot,
  updateDoc,
  deleteDoc,
  getDocs,
  addDoc,
} from 'firebase/firestore';

// --- Configuração do Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyD1IQ6u_VfG4rbnq0AFaT1jvLapEbntgUI",
  authDomain: "controle-dividas-aeca5.firebaseapp.com",
  projectId: "controle-dividas-aeca5",
  storageBucket: "controle-dividas-aeca5.firebasestorage.app",
  messagingSenderId: "613010871623",
  appId: "1:613010871623:web:37019d81909dd856816862"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'default-app-id'; 

// --- CORREÇÃO: Função Geradora de UUID (Substitui crypto.randomUUID()) ---
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0;
        var v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};
// --- FIM DA CORREÇÃO ---


// --- Componente "Tradutor" de Ícones ---
const iconMap = {
  'log-out': LogOut,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'settings': Settings,
  'plus': Plus,
  'check': Check,
  'edit': Edit,
  'trash-2': Trash2,
  'x': X,
  'layers': Layers,
  'tag': Tag,
  'utensils': Utensils,
  'home': Home,
  'car': Car,
  'shopping-cart': ShoppingCart,
  'heart-pulse': HeartPulse,
  'graduation-cap': GraduationCap,
  'bus': Bus,
  'shirt': Shirt,
  'film': Film,
  'plane': Plane,
  'gift': Gift,
  'paw-print': PawPrint,
  'dumbbell': Dumbbell,
  'briefcase': Briefcase,
  'smartphone': Smartphone,
  'landmark': Landmark,
  'receipt': Receipt,
  'wrench': Wrench,
  'pizza': Pizza,
  'filter': Filter,
  'default': AlertCircle 
};

const LucideIcon = ({ name, color, size, style }) => {
  const IconComponent = iconMap[name] || iconMap['default'];
  return <IconComponent color={color} size={size} style={style} />;
};

// --- Dados de Ícones e Cores (do main.js) ---
const iconList = [
    { value: "tag", name: "Geral" },
    { value: "utensils", name: "Alimentação" },
    { value: "home", name: "Casa" },
    { value: "car", name: "Carro" },
    { value: "shopping-cart", name: "Supermercado" },
    { value: "heart-pulse", name: "Saúde" },
    { value: "graduation-cap", name: "Educação" },
    { value: "bus", name: "Transporte" },
    { value: "shirt", name: "Roupas" },
    { value: "film", name: "Lazer" },
    { value: "plane", name: "Viagem" },
    { value: "gift", name: "Presentes" },
    { value: "paw-print", name: "Pets" },
    { value: "dumbbell", name: "Academia" },
    { value: "briefcase", name: "Trabalho" },
    { value: "smartphone", name: "Celular" },
    { value: "landmark", name: "Investimentos" },
    { value: "receipt", name: "Contas" },
    { value: "wrench", name: "Manutenção" },
    { value: "pizza", name: "Restaurante" },
    { value: "filter", name: "Filtro" },
    { value: "layers", name: "Grupo" }
];

const colorPalette = [
    { name: 'Slate', value: '#64748B' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Amber', value: '#F59E0B' },
    { name: 'Yellow', value: '#EAB308' },
    { name: 'Lime', value: '#84CC16' },
    { name: 'Green', value: '#22C55E' },
    { name: 'Emerald', value: '#10B981' },
    { name: "Teal", value: '#14B8A6' },
    { name: 'Cyan', value: '#06B6D4' },
    { name: 'Sky', value: '#0EA5E9' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Violet', value: '#8B5CF6' },
    { name: 'Purple', value: '#A855F7' },
    { name: 'Fuchsia', value: '#D946EF' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Rose', value: '#F43F5E' }
];

// --- Funções Auxiliares (DD/MM/AAAA) ---

// Função para formatar Date/Timestamp para string DD/MM/AAAA
const formatJsDateToDisplay = (date) => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${day}/${month}/${year}`;
};

// Função para formatar Timestamp do Firebase para string DD/MM/AAAA
const formatDateFromTimestamp = (timestamp) => {
  if (!timestamp) return '';
  const jsDate = timestamp.toDate();
  return formatJsDateToDisplay(jsDate);
};


// --- Componente: Tela de Login ---
function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      setError('Email ou senha inválidos.');
      console.error(e);
    }
  };

  const handleRegister = async () => {
    setError('');
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') {
        setError('Este email já está em uso.');
      } else {
        setError('Erro ao criar conta.');
      }
      console.error(e);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.loginContainer}
      >
        <Text style={styles.title}>Minhas Dívidas</Text>
        <Text style={styles.subtitle}>Acesse sua conta para continuar</Text>
        
        <TextInput
          style={styles.proInput}
          placeholder="seu@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#9ca3af"
        />
        <TextInput
          style={styles.proInput}
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#9ca3af"
        />
        
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        
        <TouchableOpacity style={styles.proButtonPrimary} onPress={handleLogin}>
          <Text style={styles.proButtonTextPrimary}>Entrar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.proButtonSecondary} onPress={handleRegister}>
          <Text style={styles.proButtonTextSecondary}>Criar Conta</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- Componente: Tela Principal do App ---
function AppScreen({ user }) {
  const [parcels, setParcels] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [includePaid, setIncludePaid] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(null); 
  const [selectedParcel, setSelectedParcel] = useState(null);

  // Estados dos Modais
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isCategoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [isEditGroupModalVisible, setEditGroupModalVisible] = useState(false);

  // Helpers
  const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
  
  const monthName = useMemo(() => {
    return capitalize(currentMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }));
  }, [currentMonth]);
  
  const totalThisMonth = useMemo(() => {
    return parcels
      .filter(p => !p.paid)
      .reduce((acc, parcel) => acc + parcel.value, 0);
  }, [parcels]);

  // --- OUVINTES DO FIREBASE ---
  useEffect(() => {
    if (!user) return;
    const categoriesCollectionPath = `artifacts/${appId}/users/${user.uid}/categories`;
    const q = query(collection(db, categoriesCollectionPath));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(cats);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);
    const startTimestamp = Timestamp.fromDate(start);
    const endTimestamp = Timestamp.fromDate(end);

    const parcelsCollectionPath = `artifacts/${appId}/users/${user.uid}/parcels`;
    let queryConstraints = [
      where("paymentDate", ">=", startTimestamp),
      where("paymentDate", "<=", endTimestamp)
    ];

    if (!includePaid) {
      queryConstraints.push(where("paid", "==", false));
    }
    if (selectedCategoryFilter) {
      queryConstraints.push(where("category.id", "==", selectedCategoryFilter.id));
    }
    
    const q = query(collection(db, parcelsCollectionPath), ...queryConstraints);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const parcelas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      parcelas.sort((a, b) => a.paymentDate.seconds - b.paymentDate.seconds);
      setParcels(parcelas);
    }, (error) => {
      console.error("Erro ao buscar parcelas:", error);
      Alert.alert("Erro de Índice", "Esta consulta precisa de um índice no Firebase.");
    });

    return () => unsubscribe();
  }, [user, currentMonth, includePaid, selectedCategoryFilter]);

  // --- Handlers de Ação ---
  const handleLogout = () => { signOut(auth); };
  const changeMonth = (amount) => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + amount, 1));
  };
  
  const handlePay = async (parcelId) => {
    const parcelRef = doc(db, `artifacts/${appId}/users/${user.uid}/parcels`, parcelId);
    try {
      await updateDoc(parcelRef, { paid: true });
    } catch (e) {
      console.error("Erro ao pagar:", e);
      Alert.alert("Erro", "Não foi possível marcar como pago.");
    }
  };
  
  // --- Funções de Modal (Abrir/Fechar) ---
  const openDeleteModal = (item) => { setSelectedParcel(item); setDeleteModalVisible(true); };
  const openEditModal = (item) => { setSelectedParcel(item); setEditModalVisible(true); };
  const openEditGroupModal = (item) => { setSelectedParcel(item); setEditGroupModalVisible(true); };
  
  // --- Funções de Modal (Salvar/Excluir) ---
  const handleDeleteOne = async () => {
    if (!selectedParcel) return;
    const parcelRef = doc(db, `artifacts/${appId}/users/${user.uid}/parcels`, selectedParcel.id);
    try {
      await deleteDoc(parcelRef);
      setDeleteModalVisible(false);
      setSelectedParcel(null);
    } catch (e) {
      console.error("Erro ao excluir:", e);
      Alert.alert("Erro", "Não foi possível excluir a parcela.");
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedParcel) return;
    const groupId = selectedParcel.debtGroupId;
    const q = query(
      collection(db, `artifacts/${appId}/users/${user.uid}/parcels`),
      where("debtGroupId", "==", groupId)
    );
    try {
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      setDeleteModalVisible(false);
      setSelectedParcel(null);
    } catch (e) {
      console.error("Erro ao excluir grupo:", e);
      Alert.alert("Erro", "Não foi possível excluir a dívida inteira.");
    }
  };

  const handleSaveEditParcel = async (newData) => {
    if (!selectedParcel) return;
    const parcelRef = doc(db, `artifacts/${appId}/users/${user.uid}/parcels`, selectedParcel.id);
    try {
      await updateDoc(parcelRef, newData);
      setEditModalVisible(false);
      setSelectedParcel(null);
    } catch(e) {
      console.error("Erro ao atualizar parcela:", e);
      Alert.alert("Erro", "Não foi possível salvar as alterações.");
    }
  };
  
  const handleSaveEditGroup = async (newDescription) => {
    if (!selectedParcel) return;
    const groupId = selectedParcel.debtGroupId;
    const q = query(
      collection(db, `artifacts/${appId}/users/${user.uid}/parcels`),
      where("debtGroupId", "==", groupId),
      where("paid", "==", false) 
    );
    try {
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        throw new Error("Nenhuma parcela em aberto encontrada para atualizar.");
      }
      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => {
        batch.update(doc.ref, { debtDescription: newDescription });
      });
      await batch.commit();
      setEditGroupModalVisible(false);
      setSelectedParcel(null);
    } catch (e) {
      console.error("Erro ao atualizar grupo:", e);
      Alert.alert("Erro", e.message || "Não foi possível salvar as alterações em lote.");
    }
  };

  // --- Componente: Item da Parcela ---
  const ParcelItem = ({ item }) => {
    // A data será formatada diretamente pelo toLocaleDateString no detalhe
    const dataVencimento = item.paymentDate.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const category = item.category;
    const categoryColor = category ? category.color : '#cbd5e1';
    const categoryIconName = category ? category.icon : 'tag';
    
    return (
      <View style={[styles.parcelItem, { borderLeftColor: categoryColor, opacity: item.paid ? 0.5 : 1 }]}>
        
        <LucideIcon 
          name={categoryIconName} 
          size={20} 
          color={categoryColor} 
          style={{ marginRight: 10 }}
        />
        
        <View style={{ flex: 1 }}>
          <Text style={[styles.parcelDescription, item.paid && styles.parcelDescriptionPaid]}>{item.debtDescription}</Text>
          <Text style={styles.parcelDetails}>
            Venc: {dataVencimento} | Parcela {item.installmentNumber}/{item.totalInstallments}
          </Text>
        </View>
        <View style={styles.parcelActions}>
          <Text style={[styles.parcelValue, item.paid && styles.parcelValuePaid]}>
            R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </Text>
          
          {!item.paid && (
            <TouchableOpacity style={styles.proButtonPay} onPress={() => handlePay(item.id)}>
              <LucideIcon name="check" size={16} color="white" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.proButtonGhost} onPress={() => openEditGroupModal(item)}>
             <LucideIcon name="layers" size={18} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.proButtonGhost} onPress={() => openEditModal(item)}>
             <LucideIcon name="edit" size={18} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.proButtonGhost} onPress={() => openDeleteModal(item)}>
             <LucideIcon name="trash-2" size={18} color="#dc2626" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Minhas Dívidas</Text>
        <TouchableOpacity style={styles.proButtonGhost} onPress={handleLogout}>
          <LucideIcon name="log-out" size={22} color="#dc2626" />
        </TouchableOpacity>
      </View>

      {/* Seletor de Mês */}
      <View style={styles.monthSelector}>
        <TouchableOpacity style={styles.monthButton} onPress={() => changeMonth(-1)}>
          <LucideIcon name="chevron-left" size={28} color="#4f46e5" />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{monthName}</Text>
        <TouchableOpacity style={styles.monthButton} onPress={() => changeMonth(1)}>
          <LucideIcon name="chevron-right" size={28} color="#4f46e5" />
        </TouchableOpacity>
      </View>
      
      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity style={styles.proInputSmall} onPress={() => setCategoryPickerVisible(true)}>
            <Text style={{color: selectedCategoryFilter ? '#000' : '#9ca3af'}}>
              {selectedCategoryFilter ? selectedCategoryFilter.name : 'Todas as categorias'}
            </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.radioOption} onPress={() => setIncludePaid(!includePaid)}>
            <View style={[styles.radioOuter, includePaid && styles.radioOuterActive]}>
              {includePaid && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.radioLabel}>Incluir pagas</Text>
        </TouchableOpacity>
      </View>

      {/* Total do Mês */}
      <View style={styles.monthTotalContainer}>
        <Text style={styles.monthTotalLabel}>Total em Aberto:</Text>
        <Text style={styles.monthTotalValue}>
          R$ {totalThisMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </Text>
      </View>

      {/* Lista de Parcelas */}
      <FlatList
        data={parcels}
        renderItem={ParcelItem}
        keyExtractor={item => item.id}
        style={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyList}>
            <Text style={styles.emptyListText}>Nenhuma parcela para os filtros selecionados.</Text>
          </View>
        }
      />
      
      {/* Botões de Ação */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity style={[styles.proButtonSecondary, {flex: 1}]} onPress={() => setCategoryModalVisible(true)}>
          <LucideIcon name="settings" size={20} color="#0f172a" style={{marginRight: 8}} />
          <Text style={styles.proButtonTextSecondary}>Categorias</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.proButtonPrimary, {flex: 1}]} onPress={() => setAddModalVisible(true)}>
          <LucideIcon name="plus" size={20} color="white" style={{marginRight: 8}} />
          <Text style={styles.proButtonTextPrimary}>Nova Dívida</Text>
        </TouchableOpacity>
      </View>

      {/* --- MODAIS --- */}

      <AddDebtModal 
        visible={isAddModalVisible}
        user={user}
        db={db}
        appId={appId}
        categories={categories}
        onClose={() => setAddModalVisible(false)}
        styles={styles}
      />

      <CategoryManagerModal 
        visible={isCategoryModalVisible}
        user={user}
        db={db}
        appId={appId}
        categories={categories}
        onClose={() => setCategoryModalVisible(false)}
        styles={styles}
      />

      <Modal
        animationType="fade"
        transparent={true}
        visible={isDeleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Confirmar Exclusão</Text>
            <Text style={styles.modalText}>
              O que você deseja excluir da dívida "{selectedParcel?.debtDescription}"?
            </Text>
            <TouchableOpacity style={styles.proButtonDanger} onPress={handleDeleteOne}>
              <Text style={styles.proButtonTextPrimary}>Excluir Apenas esta Parcela</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.proButtonDanger, {backgroundColor: '#991b1b'}]} onPress={handleDeleteGroup}>
              <Text style={styles.proButtonTextPrimary}>Excluir Dívida Inteira</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.proButtonSecondary} onPress={() => setDeleteModalVisible(false)}>
              <Text style={styles.proButtonTextSecondary}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      <CategoryPickerModal
        visible={isCategoryPickerVisible}
        categories={categories}
        onClose={() => setCategoryPickerVisible(false)}
        onSelect={(cat) => {
          setSelectedCategoryFilter(cat);
          setCategoryPickerVisible(false);
        }}
        showAllOption={true}
        styles={styles}
      />

      <EditParcelModal
        visible={isEditModalVisible}
        parcel={selectedParcel}
        onClose={() => { setEditModalVisible(false); setSelectedParcel(null); }}
        onSave={handleSaveEditParcel}
        styles={styles}
      />
      
      <EditGroupModal
        visible={isEditGroupModalVisible}
        parcel={selectedParcel}
        onClose={() => { setEditGroupModalVisible(false); setSelectedParcel(null); }}
        onSave={handleSaveEditGroup}
        styles={styles}
      />

    </SafeAreaView>
  );
}

// --- Componente: Modal de Adicionar Dívida (MODIFICADO) ---
function AddDebtModal({ visible, user, db, appId, categories, onClose, styles }) {
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [installments, setInstallments] = useState('');
  const [calcMode, setCalcMode] = useState('total'); 
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false); 

  // Função local para formatar DD/MM/AAAA
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${day}/${month}/${year}`;
  };
  
  const [startDateString, setStartDateString] = useState(formatDate(new Date())); 

  const handleSave = async () => {
    if (isSaving) return; 
    setIsSaving(true);

    const enteredValue = parseFloat(value);
    const numInstallments = parseInt(installments);
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;

    try {
      // --- Validação explícita ---
      if (!description.trim()) {
        Alert.alert("Erro", "Por favor, preencha a descrição.");
        return;
      }
      if (isNaN(enteredValue) || enteredValue <= 0) {
        Alert.alert("Erro", "Por favor, insira um valor válido e maior que zero.");
        return;
      }
      if (isNaN(numInstallments) || numInstallments <= 0 || !Number.isInteger(numInstallments)) {
        Alert.alert("Erro", "Por favor, insira um número de parcelas válido (pelo menos 1).");
        return;
      }
      if (!dateRegex.test(startDateString)) {
        Alert.alert("Erro", "Formato da data inválido. Use DD/MM/AAAA.");
        return;
      }
    
      // Parse da data DD/MM/AAAA para objeto Date
      const parts = startDateString.split('/');
      const dateISO = `${parts[2]}-${parts[1]}-${parts[0]}`;
      const startDate = new Date(dateISO + 'T12:00:00'); 
      
      let totalValue;
      let installmentValue;

      if (calcMode === 'installment') {
          installmentValue = enteredValue;
          totalValue = installmentValue * numInstallments;
      } else {
          totalValue = enteredValue;
          installmentValue = parseFloat((totalValue / numInstallments).toFixed(2));
      }

      // Usando generateUUID()
      const debtGroupId = generateUUID();
      const batch = writeBatch(db);
      const parcelsCollectionPath = `artifacts/${appId}/users/${user.uid}/parcels`;
      const parcelsCollection = collection(db, parcelsCollectionPath);
      let cumulativeValue = 0;

      for (let i = 0; i < numInstallments; i++) {
          const paymentDate = new Date(startDate);
          paymentDate.setMonth(startDate.getMonth() + i);

          let currentInstallmentValue = installmentValue;
          if (calcMode === 'total') {
              cumulativeValue += installmentValue;
              if (i === numInstallments - 1) { 
                  const difference = totalValue - cumulativeValue;
                  currentInstallmentValue = parseFloat((installmentValue + difference).toFixed(2));
              }
          }

          const parcelData = {
              debtDescription: description,
              debtGroupId: debtGroupId,
              installmentNumber: i + 1,
              totalInstallments: numInstallments,
              value: currentInstallmentValue,
              paymentDate: Timestamp.fromDate(paymentDate),
              paid: false,
              category: selectedCategory 
          };
          const newParcelRef = doc(parcelsCollection);
          batch.set(newParcelRef, parcelData);
      }

      await batch.commit();
      Alert.alert("Sucesso", `${numInstallments} parcelas criadas.`);
      onClose();
      // Limpar formulário
      setDescription('');
      setValue('');
      setInstallments('');
      setSelectedCategory(null);
      setCalcMode('total');
      setStartDateString(formatDate(new Date())); 

    } catch (e) {
      console.error("Erro ao salvar dívida:", e);
      Alert.alert("Erro", "Não foi possível salvar a dívida.");
    } finally {
      setIsSaving(false); 
    }
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
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.modalView}>
            
            <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
              <LucideIcon name="x" size={24} color="#64748b" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Adicionar Nova Dívida</Text>
            
            <TextInput
              style={styles.proInput}
              placeholder="Descrição (Ex: TV da Sala)"
              value={description}
              onChangeText={setDescription}
              placeholderTextColor="#9ca3af"
            />
            
            <TouchableOpacity 
              style={styles.iconSelectorButton} 
              onPress={() => setPickerVisible(true)}
            >
              {selectedCategory ? (
                <View style={[styles.iconPreview, { backgroundColor: selectedCategory.color || '#64748B' }]}>
                  <LucideIcon name={selectedCategory.icon || 'tag'} size={20} color="#fff" />
                </View>
              ) : (
                <View style={[styles.iconPreview, { backgroundColor: '#cbd5e1' }]}>
                  <LucideIcon name="tag" size={20} color="#fff" />
                </View>
              )}
              <Text style={styles.iconSelectorText}>
                {selectedCategory ? selectedCategory.name : 'Escolha uma categoria...'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.modalLabel}>Data da 1ª Parcela</Text>
            <TextInput
              style={styles.proInput}
              placeholder="Data Venc. (DD/MM/AAAA)"
              value={startDateString}
              onChangeText={setStartDateString}
              placeholderTextColor="#9ca3af"
            />

            <Text style={styles.modalLabel}>Tipo de Cálculo</Text>
            <View style={styles.radioContainer}>
              <TouchableOpacity style={styles.radioOption} onPress={() => setCalcMode('total')}>
                <View style={[styles.radioOuter, calcMode === 'total' && styles.radioOuterActive]}>
                  {calcMode === 'total' && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.radioLabel}>Valor Total</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.radioOption} onPress={() => setCalcMode('installment')}>
                <View style={[styles.radioOuter, calcMode === 'installment' && styles.radioOuterActive]}>
                  {calcMode === 'installment' && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.radioLabel}>Valor da Parcela</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.proInput, {flex: 1}]}
                placeholder={calcMode === 'total' ? 'Valor Total' : 'Valor da Parcela'}
                value={value}
                onChangeText={setValue}
                keyboardType="numeric"
                placeholderTextColor="#9ca3af"
              />
              <TextInput
                style={[styles.proInput, {flex: 1, marginLeft: 10}]}
                placeholder="Nº Parcelas"
                value={installments}
                onChangeText={setInstallments}
                keyboardType="number-pad"
                placeholderTextColor="#9ca3af"
              />
            </View>
            
            <TouchableOpacity 
              style={[
                styles.proButtonPrimary, 
                {flex: 0}, 
                isSaving && styles.buttonDisabled 
              ]} 
              onPress={handleSave}
              disabled={isSaving} 
            >
              <Text style={styles.proButtonTextPrimary}>
                {isSaving ? "Salvando..." : "Salvar Dívida"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.proButtonSecondary, {flex: 0, marginBottom: 0}]} onPress={onClose}>
              <Text style={styles.proButtonTextSecondary}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CategoryPickerModal
        visible={isPickerVisible}
        categories={categories}
        onClose={() => setPickerVisible(false)}
        onSelect={(cat) => {
          setSelectedCategory(cat);
          setPickerVisible(false);
        }}
        styles={styles}
      />
    </Modal>
  );
}

// --- Componente Paleta de Cores ---
function ColorPalette({ selectedColor, onSelectColor }) {
  return (
    <View>
      <Text style={styles.modalLabel}>Cor</Text>
      <View style={styles.colorPaletteContainer}>
        {colorPalette.map((item) => {
          const isSelected = selectedColor === item.value;
          return (
            <TouchableOpacity
              key={item.value} 
              style={[
                styles.colorSwatch,
                { backgroundColor: item.value },
                isSelected && styles.colorSwatchSelected
              ]}
              onPress={() => onSelectColor(item.value)}
            />
          );
        })}
      </View>
    </View>
  );
}

// --- Componente Modal Picker de Ícones ---
function IconPickerModal({ visible, onClose, onSelectIcon, styles }) {
  
  const renderIconItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.iconPickerItem}
      onPress={() => {
        onSelectIcon(item.value);
        onClose();
      }}
    >
      <LucideIcon name={item.value} size={24} color="#0f172a" />
      <Text style={styles.iconPickerLabel}>{item.name}</Text>
    </TouchableOpacity>
  );
  
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalView}>
          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
            <LucideIcon name="x" size={24} color="#64748b" />
          </TouchableOpacity>
          
          <Text style={styles.modalTitle}>Escolha um Ícone</Text>
          <FlatList
            data={iconList}
            renderItem={renderIconItem}
            keyExtractor={item => item.value}
            style={styles.categoryList} 
          />
        </View>
      </View>
    </Modal>
  );
}


// --- Componente Modal Gerenciador de Categorias (MODIFICADO) ---
function CategoryManagerModal({ visible, user, db, appId, categories, onClose, styles }) {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('tag');
  const [selectedColor, setSelectedColor] = useState('#64748B');
  const [isIconPickerVisible, setIconPickerVisible] = useState(false);

  useEffect(() => {
    if (!visible) {
      setName('');
      setSelectedIcon('tag');
      setSelectedColor('#64748B');
    }
  }, [visible]);

  const handleAddCategory = async () => {
    if (!name) {
        Alert.alert("Erro", "O nome da categoria é obrigatório.");
        return;
    }
    const categoriesCollectionPath = `artifacts/${appId}/users/${user.uid}/categories`;
    try {
      await addDoc(collection(db, categoriesCollectionPath), {
        name: name,
        icon: selectedIcon, 
        color: selectedColor 
      });
      setName('');
      setSelectedIcon('tag');
      setSelectedColor('#64748B');
    } catch (e) {
      console.error("Erro ao adicionar categoria:", e);
      Alert.alert("Erro", "Não foi possível salvar a categoria.");
    }
  };

  const handleDeleteCategory = (categoryId) => {
    Alert.alert(
      "Excluir Categoria",
      "Tem certeza? Isso não removerá a categoria de dívidas antigas.",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Excluir", 
          style: "destructive", 
          onPress: async () => {
            const categoryRef = doc(db, `artifacts/${appId}/users/${user.uid}/categories`, categoryId);
            try {
              await deleteDoc(categoryRef);
            } catch (e) {
              console.error("Erro ao excluir categoria:", e);
              Alert.alert("Erro", "Não foi possível excluir.");
            }
          } 
        }
      ]
    );
  };
  
  return (
    <>
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
          <ScrollView contentContainerStyle={styles.scrollViewContent}> 
            <View style={styles.modalView}>
              <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
                <LucideIcon name="x" size={24} color="#64748b" />
              </TouchableOpacity>
              
              <Text style={styles.modalTitle}>Gerenciar Categorias</Text>
              
              {/* Seção Nova Categoria */}
              <Text style={styles.modalSectionTitle}>Nova Categoria</Text>
              <TextInput
                style={styles.proInput}
                placeholder="Nome da nova categoria"
                value={name}
                onChangeText={setName}
                placeholderTextColor="#9ca3af"
              />
              
              <Text style={styles.modalLabel}>Ícone</Text>
              <TouchableOpacity 
                style={styles.iconSelectorButton} 
                onPress={() => setIconPickerVisible(true)}
              >
                <View style={[styles.iconPreview, { backgroundColor: selectedColor }]}>
                    <LucideIcon name={selectedIcon} size={20} color="#fff" />
                </View>
                <Text style={styles.iconSelectorText}>
                  {iconList.find(i => i.value === selectedIcon)?.name || 'Escolher'}
                </Text>
              </TouchableOpacity>

              <ColorPalette
                selectedColor={selectedColor}
                onSelectColor={setSelectedColor}
              />
              
              <TouchableOpacity 
                style={[styles.proButtonPrimary, {flex: 0, marginTop: 16}]} 
                onPress={handleAddCategory}
              >
                <LucideIcon name="check" size={20} color="white" style={{marginRight: 8}} />
                <Text style={styles.proButtonTextPrimary}>Salvar Categoria</Text>
              </TouchableOpacity>


              {/* Seção Categorias Salvas (MODIFICADA para usar .map) */}
              <Text style={styles.modalSectionTitle}>Categorias Salvas</Text>
              
              <View style={styles.categoryList}>
                {categories.length === 0 ? (
                  <Text style={styles.emptyListText}>Nenhuma categoria cadastrada.</Text>
                ) : (
                  categories.map((item) => (
                    <View style={styles.categoryItem} key={item.id}>
                      <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                        <LucideIcon name={item.icon || 'tag'} size={20} color={item.color || '#64748b'} />
                        <Text style={styles.categoryLabel} numberOfLines={1}>{item.name}</Text>
                      </View>
                      <TouchableOpacity onPress={() => handleDeleteCategory(item.id)} style={styles.proButtonGhost}>
                        <LucideIcon name="trash-2" size={20} color="#dc2626" />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
              
              <TouchableOpacity style={[styles.proButtonSecondary, {flex: 0, marginBottom: 0}]} onPress={onClose}>
                <Text style={styles.proButtonTextSecondary}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <IconPickerModal
        visible={isIconPickerVisible}
        onClose={() => setIconPickerVisible(false)}
        onSelectIcon={setSelectedIcon}
        styles={styles}
      />
    </>
  );
}


// --- Componente: Picker de Categoria Customizado ---
function CategoryPickerModal({ visible, categories, onClose, onSelect, showAllOption = false, styles }) {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalView}>
          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
            <LucideIcon name="x" size={24} color="#64748b" />
          </TouchableOpacity>
          
          <Text style={styles.modalTitle}>Escolha uma Categoria</Text>
          <FlatList
            data={categories}
            style={styles.categoryList}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.categoryPickerItem} onPress={() => onSelect(item)}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <LucideIcon name={item.icon || 'tag'} size={20} color={item.color || '#64748b'} style={{marginRight: 10}} />
                  <Text style={styles.categoryLabel}>{item.name}</Text>
                </View>
              </TouchableOpacity>
            )}
            ListHeaderComponent={
              <>
                {showAllOption && (
                  <TouchableOpacity style={styles.categoryPickerItem} onPress={() => onSelect(null)}>
                    <Text style={[styles.categoryLabel, {fontStyle: 'italic'}]}>Todas as categorias</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.categoryPickerItem} onPress={() => onSelect(null)}>
                  <Text style={[styles.categoryLabel, {fontStyle: 'italic'}]}>Sem categoria</Text>
                </TouchableOpacity>
              </>
            }
          />
          <TouchableOpacity style={[styles.proButtonSecondary, {flex: 0, marginBottom: 0}]} onPress={onClose}>
            <Text style={styles.proButtonTextSecondary}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// --- Componente: Modal de Editar Parcela ---
function EditParcelModal({ visible, parcel, onClose, onSave, styles }) {
  
  // Função para formatar Timestamp para string DD/MM/AAAA
  const formatDate = (timestamp) => {
    return formatDateFromTimestamp(timestamp);
  };

  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [date, setDate] = useState(''); 

  useEffect(() => {
    if (parcel) {
      setDescription(parcel.debtDescription);
      setValue(parcel.value.toString());
      setDate(formatDate(parcel.paymentDate));
    }
  }, [parcel]);

  const handleSave = () => {
    const newValue = parseFloat(value);
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    
    if (!description || !newValue || !dateRegex.test(date)) {
      Alert.alert("Erro", "Por favor, preencha todos os campos corretamente (Data: DD/MM/AAAA).");
      return;
    }
    
    // Parse da data DD/MM/AAAA para objeto Date
    const parts = date.split('/');
    const dateISO = `${parts[2]}-${parts[1]}-${parts[0]}`;
    const newDate = new Date(dateISO + 'T12:00:00'); 
    
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
          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
            <LucideIcon name="x" size={24} color="#64748b" />
          </TouchableOpacity>

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
            placeholder="Data Venc. (DD/MM/AAAA)"
            value={date}
            onChangeText={setDate}
            placeholderTextColor="#9ca3af"
          />
          
          <TouchableOpacity style={[styles.proButtonPrimary, {flex: 0}]} onPress={handleSave}>
            <Text style={styles.proButtonTextPrimary}>Salvar Alterações</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.proButtonSecondary, {flex: 0, marginBottom: 0}]} onPress={onClose}>
            <Text style={styles.proButtonTextSecondary}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// --- Componente: Modal de Editar Grupo ---
function EditGroupModal({ visible, parcel, onClose, onSave, styles }) {
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
            <LucideIcon name="x" size={24} color="#64748b" />
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


// --- Componente Principal ---
export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe(); 
  }, []);

  return user ? <AppScreen user={user} /> : <LoginScreen />;
}

// --- Folha de Estilos (StyleSheet) ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc', // bg-slate-50
  },
  // --- Estilos de Login ---
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f8fafc', // bg-slate-50
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a', // text-slate-900
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b', // text-slate-600
    textAlign: 'center',
    marginBottom: 24,
  },
  errorText: {
    color: '#dc2626', // text-red-600
    textAlign: 'center',
    marginBottom: 12,
  },
  // --- Estilos "Pro" (Replicando o CSS) ---
  proInput: {
    height: 44,
    width: '100%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1', // border-slate-300
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 16,
  },
  proInputSmall: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1', // border-slate-300
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    justifyContent: 'center',
    flex: 1,
  },
  proButtonPrimary: {
    backgroundColor: '#0f172a', // bg-slate-900
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row', 
  },
  proButtonTextPrimary: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 16,
  },
  proButtonSecondary: {
    backgroundColor: '#fff', // bg-white
    borderWidth: 1,
    borderColor: '#cbd5e1', // border-slate-300
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row', 
  },
  proButtonTextSecondary: {
    color: '#0f172a', // text-slate-900
    fontWeight: '500',
    fontSize: 16,
  },
  proButtonPay: {
    backgroundColor: '#16a34a', // bg-green-600
    borderRadius: 6,
    padding: 6, 
    marginRight: 4,
  },
  proButtonGhost: {
    padding: 6,
  },
  proButtonDanger: {
     backgroundColor: '#dc2626', // bg-red-600
     height: 44,
     justifyContent: 'center',
     alignItems: 'center',
     borderRadius: 8,
     marginBottom: 12,
  },
  proButtonDangerOutline: {
     backgroundColor: '#f8fafc', // bg-red-600
     height: 44,
     justifyContent: 'center',
     alignItems: 'center',
     borderRadius: 8,
     marginBottom: 12,
     borderColor: '#dc2626',
     borderWidth: 1,
  },
  // --- Estilos do App ---
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0', 
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  monthButton: {
    paddingHorizontal: 10,
  },
  monthLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  monthTotalContainer: {
    backgroundColor: '#eef2ff', // indigo-50
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c7d2fe', // indigo-200
  },
  monthTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3730a3', // indigo-800
  },
  monthTotalValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4f46e5', // indigo-600
  },
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 10,
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  emptyList: {
    padding: 20,
    alignItems: 'center',
  },
  emptyListText: {
    fontSize: 16,
    color: '#64748b',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 10,
  },
  // --- Estilos do Item da Parcela ---
  parcelItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 5,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  parcelDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b', // slate-800
    flexShrink: 1, 
  },
  parcelDescriptionPaid: {
    textDecorationLine: 'line-through',
    color: '#64748b',
  },
  parcelDetails: {
    fontSize: 14,
    color: '#64748b',
  },
  parcelActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  parcelValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc2626',
    marginRight: 8,
  },
  parcelValuePaid: {
    color: '#16a34a', // green-600
  },
  // --- Estilos de Modal ---
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    gap: 10, 
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 10,
    zIndex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  radioContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 20,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#9ca3af',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioOuterActive: {
    borderColor: '#4f46e5',
  },
  radioInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#4f46e5',
  },
  radioLabel: {
    fontSize: 16,
    color: '#374151',
  },
  categoryList: {
    maxHeight: 200, 
    width: '100%',
    marginBottom: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8, 
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  categoryPickerItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    alignItems: 'center',
  },
  categoryLabel: {
    fontSize: 16,
    flex: 1, 
    marginLeft: 10, 
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 8,
    marginBottom: 8,
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    paddingTop: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  iconSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    width: '100%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    marginBottom: 16, 
  },
  iconPreview: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconSelectorText: {
    fontSize: 16,
    color: '#0f172a',
  },
  colorPaletteContainer: {
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'flex-start', 
    marginBottom: 16,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    margin: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  colorSwatchSelected: {
    borderWidth: 2,
    borderColor: '#0f172a', 
    transform: [{ scale: 1.1 }],
  },
  iconPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  iconPickerLabel: {
    fontSize: 16,
    marginLeft: 12,
    color: '#1e293b',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});