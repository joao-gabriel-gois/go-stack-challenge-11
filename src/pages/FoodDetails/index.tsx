import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { AppRegistry, Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      const { id } = routeParams;

      const response = await api.get(`foods/${id}`);

      const currentFood = {
        ...response.data,
        formattedPrice: formatValue(response.data.price),
      }

      setFood(currentFood);
      const currentExtras = currentFood.extras.map((extra: Extra) => {
        return {
          ...extra,
          quantity: 0,
        }
      })
      setExtras(currentExtras);
    }

    loadFood();
  }, [routeParams]);

  const handleIncrementExtra = useCallback((id: number): void => {
    const extra = food.extras.find((extra: Extra) => extra.id === id);

    const currentExtras = extras.map((mappedExtra: Extra) => {
      if (extra && extra.id == mappedExtra.id) {
        const updatedExtra = {
          ...extra,
          quantity: mappedExtra.quantity + 1,
        }

        return updatedExtra;
      }

      return {
        ...mappedExtra,
        quantity: mappedExtra.quantity,
      }
    });

    setExtras(currentExtras);
  }, [food, extras]);

  const handleDecrementExtra = useCallback((id: number): void => {
    const extra = food.extras.find((extra: Extra) => extra.id === id);

    const currentExtras = extras.map((mappedExtra: Extra) => {
      if (extra && extra.id == mappedExtra.id && mappedExtra.quantity > 0) {
        const updatedExtra = {
          ...extra,
          quantity: mappedExtra.quantity - 1,
        }

        return updatedExtra;
      }

      return {
        ...mappedExtra,
        quantity: mappedExtra.quantity,
      }
    })

    setExtras(currentExtras);
  }, [food, extras]);

  const handleIncrementFood = useCallback((): void => {
    setFoodQuantity(foodQuantity + 1)
  }, [foodQuantity]);

  const handleDecrementFood = useCallback((): void => {
    if (foodQuantity > 1) {
      setFoodQuantity(foodQuantity - 1);
    }
  }, [foodQuantity]);

  const toggleFavorite = useCallback(() => {
    setIsFavorite(!isFavorite);
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    const foodValue = food.price * foodQuantity;

    const eachExtraPriceArray = extras.map((extra: Extra) => {
      return extra.quantity * extra.value;
    })

    const extrasTotalPrice = eachExtraPriceArray.reduce((previousPrice, acumulatedPrice) => {
      return previousPrice + acumulatedPrice
    }, 0);

    return formatValue(extrasTotalPrice + foodValue);
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    const order = {
      ...food,
      extras,
    }


    for (let i = 0; i < foodQuantity; i++) {
      await api.post('orders', order);
    }
  }
  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
