from rest_framework import serializers
from .models import Product, Invoice, InvoiceItem
from decimal import Decimal

class ProductSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = '__all__'

    def get_image_url(self, obj):
        if obj.image:
            url = obj.image.url
            # Cloudinary URLs are already absolute; don't prefix them
            if url.startswith('http'):
                return url
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(url)
            return url
        return None


class InvoiceItemSerializer(serializers.ModelSerializer):
    amount = serializers.SerializerMethodField()

    class Meta:
        model = InvoiceItem
        fields = ['id', 'product_name', 'qty', 'price', 'discount_pct', 'amount']

    def get_amount(self, obj):
        return float(obj.amount)


class InvoiceSerializer(serializers.ModelSerializer):
    items      = InvoiceItemSerializer(many=True)
    created_by = serializers.StringRelatedField(read_only=True)
    class Meta:
        model = Invoice
        fields = [
            'id', 'pm_number', 'customer', 'address', 'station',
            'has_billing', 'billing_name', 'billing_address', 'billing_station',
            'transport', 'gst_no', 'phone',
            'date', 'classification', 'remark',
            'packing_charge', 'booking_charge', 'dori_qty',
            'total', 'created_by', 'created_at', 'items'
        ]

    def _calc_total(self, items_data, packing, booking, dori_qty):
        subtotal = sum(
            (Decimal(str(i['qty'])) * Decimal(str(i['price']))) -
            (Decimal(str(i['qty'])) * Decimal(str(i['price'])) * (Decimal(str(i.get('discount_pct', 0))) / 100))
            for i in items_data
        )
        dori_amount = Decimal(str(dori_qty)) * Decimal('0.18')
        return subtotal + Decimal(str(packing)) + Decimal(str(booking)) + dori_amount

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        validated_data['total'] = self._calc_total(
            items_data,
            validated_data.get('packing_charge', 0),
            validated_data.get('booking_charge', 0),
            validated_data.get('dori_qty', 0),
        )
        invoice = Invoice.objects.create(**validated_data)
        for item in items_data:
            InvoiceItem.objects.create(invoice=invoice, **item)
        return invoice

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        if items_data is not None:
            instance.items.all().delete()
            for item in items_data:
                InvoiceItem.objects.create(invoice=instance, **item)
            instance.total = self._calc_total(
                items_data, instance.packing_charge, instance.booking_charge, instance.dori_qty
            )
        instance.save()
        return instance